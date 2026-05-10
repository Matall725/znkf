import pino from 'pino';
import type { LogLevel } from '../config/environment.ts';

export type AppLogLevel = LogLevel | 'silent';

export interface AppLogger {
  info(bindings: Record<string, unknown>, message: string): void;
  error(bindings: Record<string, unknown>, message: string): void;
}

export function createAppLogger(level: AppLogLevel = 'info'): AppLogger {
  const logger = pino({
    level,
  });

  return {
    info(bindings, message) {
      logger.info(bindings, message);
    },
    error(bindings, message) {
      logger.error(bindings, message);
    },
  };
}
