import type { Express } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  UnauthenticatedError,
} from '../src/errors/api-error';
import { HealthService } from '../src/health/health.service';
import type { HealthDependencyCheck } from '../src/health/health.types';
import type { AppLogger } from '../src/logging/logger';
import { createApiServer } from '../src/server';

const healthyCheck = (name: HealthDependencyCheck['name']): HealthDependencyCheck => ({
  name,
  check: async () => ({
    status: 'ok',
    latencyMs: 1,
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

function createTestServer(configureRoutes: (app: Express) => void): Express {
  return createApiServer({
    healthService: new HealthService([healthyCheck('database'), healthyCheck('redis')]),
    logger: noopLogger,
    configureRoutes,
  });
}

describe('unified error response', () => {
  it('returns a consistent bad request response', async () => {
    const app = createTestServer((server) => {
      server.get('/bad-request', () => {
        throw new BadRequestError('visitor_id is required.', {
          details: {
            field: 'visitor_id',
          },
        });
      });
    });

    const response = await request(app).get('/bad-request').expect(400);

    expect(response.body).toEqual({
      error: {
        code: 'BAD_REQUEST',
        message: 'visitor_id is required.',
        statusCode: 400,
        requestId: expect.any(String),
        details: {
          field: 'visitor_id',
        },
      },
    });
  });

  it('returns a consistent unauthenticated response', async () => {
    const app = createTestServer((server) => {
      server.get('/private', () => {
        throw new UnauthenticatedError();
      });
    });

    const response = await request(app).get('/private').expect(401);

    expect(response.body).toEqual({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication is required.',
        statusCode: 401,
        requestId: expect.any(String),
      },
    });
  });

  it('returns a consistent forbidden response', async () => {
    const app = createTestServer((server) => {
      server.get('/forbidden', () => {
        throw new ForbiddenError();
      });
    });

    const response = await request(app).get('/forbidden').expect(403);

    expect(response.body).toEqual({
      error: {
        code: 'FORBIDDEN',
        message: 'Permission denied.',
        statusCode: 403,
        requestId: expect.any(String),
      },
    });
  });

  it('returns a consistent not found response', async () => {
    const app = createTestServer(() => undefined);

    const response = await request(app).get('/missing-resource').expect(404);

    expect(response.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Route GET /missing-resource was not found.',
        statusCode: 404,
        requestId: expect.any(String),
      },
    });
  });

  it('returns a consistent conflict response', async () => {
    const app = createTestServer((server) => {
      server.post('/conflict', () => {
        throw new ConflictError('Conversation is already closed.');
      });
    });

    const response = await request(app).post('/conflict').expect(409);

    expect(response.body).toEqual({
      error: {
        code: 'CONFLICT',
        message: 'Conversation is already closed.',
        statusCode: 409,
        requestId: expect.any(String),
      },
    });
  });

  it('returns a consistent internal error response without leaking details', async () => {
    const app = createTestServer((server) => {
      server.get('/boom', () => {
        throw new Error('database password leaked in stack');
      });
    });

    const response = await request(app).get('/boom').expect(500);

    expect(response.body).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error.',
        statusCode: 500,
        requestId: expect.any(String),
      },
    });
  });
});
