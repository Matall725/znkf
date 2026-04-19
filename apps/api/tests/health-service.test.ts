import { describe, expect, it } from 'vitest';
import { HealthService } from '../src/health/health.service';
import type { HealthDependencyCheck } from '../src/health/health.types';

const okCheck = (name: HealthDependencyCheck['name']): HealthDependencyCheck => ({
  name,
  check: async () => ({
    status: 'ok',
    latencyMs: 1,
  }),
});

const failingCheck = (
  name: HealthDependencyCheck['name'],
  message: string,
): HealthDependencyCheck => ({
  name,
  check: async () => ({
    status: 'error',
    latencyMs: 1,
    message,
  }),
});

describe('health service', () => {
  it('reports ok when application, database, and redis checks pass', async () => {
    const service = new HealthService([okCheck('database'), okCheck('redis')]);

    await expect(service.getHealthReport()).resolves.toMatchObject({
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

  it('reports a degraded state with the failed dependency message', async () => {
    const service = new HealthService([
      failingCheck('database', 'connect ECONNREFUSED 127.0.0.1:5432'),
      okCheck('redis'),
    ]);

    await expect(service.getHealthReport()).resolves.toMatchObject({
      status: 'degraded',
      dependencies: {
        database: {
          status: 'error',
          message: 'connect ECONNREFUSED 127.0.0.1:5432',
        },
        redis: {
          status: 'ok',
        },
      },
    });
  });
});
