import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { HealthService } from '../src/health/health.service';
import type { HealthDependencyCheck } from '../src/health/health.types';
import type { AppLogger } from '../src/logging/logger';
import { createApiServer } from '../src/server';

const check = (
  name: HealthDependencyCheck['name'],
  status: 'ok' | 'error',
  message?: string,
): HealthDependencyCheck => ({
  name,
  check: async () => ({
    status,
    latencyMs: 1,
    ...(message ? { message } : {}),
  }),
});

const noopLogger: AppLogger = {
  info() {
    return undefined;
  },
  error() {
    return undefined;
  },
};

describe('health route', () => {
  it('returns 200 when all dependencies are healthy', async () => {
    const app = createApiServer({
      healthService: new HealthService([check('database', 'ok'), check('redis', 'ok')]),
      logger: noopLogger,
    });

    const response = await request(app).get('/health').expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      application: {
        status: 'ok',
      },
      dependencies: {
        database: {
          status: 'ok',
        },
        redis: {
          status: 'ok',
        },
      },
    });
  });

  it('returns 503 and identifies an unavailable dependency', async () => {
    const app = createApiServer({
      healthService: new HealthService([
        check('database', 'ok'),
        check('redis', 'error', 'Redis connection refused'),
      ]),
      logger: noopLogger,
    });

    const response = await request(app).get('/health').expect(503);

    expect(response.body).toMatchObject({
      status: 'degraded',
      dependencies: {
        database: {
          status: 'ok',
        },
        redis: {
          status: 'error',
          message: 'Redis connection refused',
        },
      },
    });
  });
});
