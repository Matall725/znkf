import type { AppEnvironmentConfig } from '../config/environment.ts';
import { createPostgresHealthCheck, createRedisHealthCheck } from './dependency-checks.ts';
import type {
  HealthDependencyCheck,
  HealthDependencyReport,
  HealthReport,
} from './health.types.ts';

export class HealthService {
  private readonly checks: HealthDependencyCheck[];

  constructor(checks: HealthDependencyCheck[]) {
    this.checks = checks;
  }

  static fromEnvironment(environment: AppEnvironmentConfig): HealthService {
    return new HealthService([
      createPostgresHealthCheck(environment.database.url),
      createRedisHealthCheck(environment.redis.url),
    ]);
  }

  async getHealthReport(): Promise<HealthReport> {
    const results = await Promise.all(
      this.checks.map(async (check) => [check.name, await check.check()] as const),
    );
    const dependencies = Object.fromEntries(results) as Record<
      HealthDependencyCheck['name'],
      HealthDependencyReport
    >;
    const status = Object.values(dependencies).every((dependency) => dependency.status === 'ok')
      ? 'ok'
      : 'degraded';

    return {
      status,
      checkedAt: new Date().toISOString(),
      application: {
        status: 'ok',
        uptimeSeconds: Math.round(process.uptime()),
      },
      dependencies,
    };
  }
}
