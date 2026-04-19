import { Redis } from 'ioredis';
import { Pool } from 'pg';
import type {
  HealthDependencyCheck,
  HealthDependencyName,
  HealthDependencyReport,
} from './health.types.ts';

const defaultTimeoutMs = 1000;

function errorMessage(error: unknown): string {
  if (error instanceof AggregateError) {
    const nestedMessages = error.errors
      .map((nestedError) => errorMessage(nestedError))
      .filter((message) => message.length > 0);

    if (nestedMessages.length > 0) {
      return nestedMessages.join('; ');
    }
  }

  if (error instanceof Error) {
    const code = 'code' in error && typeof error.code === 'string' ? ` [${error.code}]` : '';
    return `${error.message || error.name}${code}`;
  }

  return String(error);
}

async function measureDependency(run: () => Promise<void>): Promise<HealthDependencyReport> {
  const startedAt = Date.now();

  try {
    await run();

    return {
      status: 'ok',
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      status: 'error',
      latencyMs: Date.now() - startedAt,
      message: errorMessage(error),
    };
  }
}

export function createPostgresHealthCheck(
  connectionString: string,
  timeoutMs = defaultTimeoutMs,
): HealthDependencyCheck {
  return {
    name: 'database',
    check: () =>
      measureDependency(async () => {
        const pool = new Pool({
          connectionString,
          connectionTimeoutMillis: timeoutMs,
          idleTimeoutMillis: timeoutMs,
          max: 1,
        });

        try {
          const client = await pool.connect();

          try {
            await client.query('SELECT 1');
          } finally {
            client.release();
          }
        } finally {
          await pool.end();
        }
      }),
  };
}

export function createRedisHealthCheck(
  connectionString: string,
  timeoutMs = defaultTimeoutMs,
): HealthDependencyCheck {
  return {
    name: 'redis',
    check: () =>
      measureDependency(async () => {
        const client = new Redis(connectionString, {
          connectTimeout: timeoutMs,
          enableOfflineQueue: false,
          lazyConnect: true,
          maxRetriesPerRequest: 0,
          retryStrategy: () => null,
        });
        let connectionError: unknown;

        client.on('error', (error) => {
          connectionError = error;
        });

        try {
          try {
            await client.connect();
            const pong = await client.ping();

            if (pong !== 'PONG') {
              throw new Error(`Unexpected Redis ping response: ${pong}`);
            }
          } catch (error) {
            throw connectionError ?? error;
          }
        } finally {
          client.disconnect();
        }
      }),
  };
}

export function createUnavailableDependencyCheck(
  name: HealthDependencyName,
  message: string,
): HealthDependencyCheck {
  return {
    name,
    check: async () => ({
      status: 'error',
      latencyMs: 0,
      message,
    }),
  };
}
