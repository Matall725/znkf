import type { Express } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { HealthService } from '../src/health/health.service';
import type { HealthDependencyCheck } from '../src/health/health.types';
import type { AppLogger } from '../src/logging/logger';
import { requestIdHeaderName } from '../src/logging/request-context';
import { createApiServer } from '../src/server';

interface CapturedLog {
  level: 'info' | 'error';
  bindings: Record<string, unknown>;
  message: string;
}

const healthyCheck = (name: HealthDependencyCheck['name']): HealthDependencyCheck => ({
  name,
  check: async () => ({
    status: 'ok',
    latencyMs: 1,
  }),
});

function createCapturingLogger(logs: CapturedLog[]): AppLogger {
  return {
    info(bindings, message) {
      logs.push({
        level: 'info',
        bindings,
        message,
      });
    },
    error(bindings, message) {
      logs.push({
        level: 'error',
        bindings,
        message,
      });
    },
  };
}

function createTestServer(logs: CapturedLog[], configureRoutes?: (app: Express) => void): Express {
  return createApiServer({
    healthService: new HealthService([healthyCheck('database'), healthyCheck('redis')]),
    logger: createCapturingLogger(logs),
    configureRoutes,
  });
}

describe('request logging and correlation id', () => {
  it('generates a request id and logs successful request start and finish', async () => {
    const logs: CapturedLog[] = [];
    const app = createTestServer(logs);

    const response = await request(app).get('/health').expect(200);
    const requestIdHeader = response.headers[requestIdHeaderName];

    expect(typeof requestIdHeader).toBe('string');
    const requestId = requestIdHeader as string;
    expect(requestId.length).toBeGreaterThan(0);
    expect(logs).toEqual([
      {
        level: 'info',
        message: 'request started',
        bindings: expect.objectContaining({
          event: 'request.start',
          requestId,
          method: 'GET',
          path: '/health',
        }),
      },
      {
        level: 'info',
        message: 'request completed',
        bindings: expect.objectContaining({
          event: 'request.finish',
          requestId,
          method: 'GET',
          path: '/health',
          statusCode: 200,
          durationMs: expect.any(Number),
        }),
      },
    ]);
  });

  it('reuses an inbound request id across response headers and logs', async () => {
    const logs: CapturedLog[] = [];
    const app = createTestServer(logs);

    await request(app)
      .get('/health')
      .set(requestIdHeaderName, 'client-request-123')
      .expect(200)
      .expect(requestIdHeaderName, 'client-request-123');

    expect(logs.every((log) => log.bindings.requestId === 'client-request-123')).toBe(true);
  });

  it('logs failed requests with the same request id as the error response', async () => {
    const logs: CapturedLog[] = [];
    const app = createTestServer(logs, (server) => {
      server.get('/boom', () => {
        throw new Error('database password leaked in stack');
      });
    });

    const response = await request(app)
      .get('/boom')
      .set(requestIdHeaderName, 'failed-request-456')
      .expect(500)
      .expect(requestIdHeaderName, 'failed-request-456');

    expect(response.body).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error.',
        statusCode: 500,
        requestId: 'failed-request-456',
      },
    });
    expect(logs).toContainEqual({
      level: 'error',
      message: 'request failed',
      bindings: expect.objectContaining({
        event: 'request.error',
        requestId: 'failed-request-456',
        method: 'GET',
        path: '/boom',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        err: expect.any(Error),
      }),
    });
    expect(logs).toContainEqual({
      level: 'info',
      message: 'request completed',
      bindings: expect.objectContaining({
        event: 'request.finish',
        requestId: 'failed-request-456',
        statusCode: 500,
      }),
    });
  });
});
