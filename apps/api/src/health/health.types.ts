export type HealthStatus = 'ok' | 'error';
export type OverallHealthStatus = 'ok' | 'degraded';
export type HealthDependencyName = 'database' | 'redis';

export interface HealthDependencyReport {
  status: HealthStatus;
  latencyMs: number;
  message?: string;
}

export interface ApplicationHealthReport {
  status: 'ok';
  uptimeSeconds: number;
}

export interface HealthReport {
  status: OverallHealthStatus;
  checkedAt: string;
  application: ApplicationHealthReport;
  dependencies: {
    database: HealthDependencyReport;
    redis: HealthDependencyReport;
  };
}

export interface HealthDependencyCheck {
  name: HealthDependencyName;
  check: () => Promise<HealthDependencyReport>;
}
