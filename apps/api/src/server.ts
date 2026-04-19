import express, { type Express } from 'express';
import { createAuthRouter } from './auth/auth.router.ts';
import { createAuthServiceFromEnvironment, type AuthService } from './auth/auth.service.ts';
import type { AppEnvironmentConfig } from './config/environment.ts';
import { loadRuntimeEnvironmentConfig } from './config/runtime-environment.ts';
import { createErrorHandler, createNotFoundHandler } from './errors/error.middleware.ts';
import { createHealthRouter } from './health/health.router.ts';
import { HealthService } from './health/health.service.ts';
import { createAppLogger, type AppLogger } from './logging/logger.ts';
import { createRequestContextMiddleware } from './logging/request-context.middleware.ts';
import { createRequestLoggingMiddleware } from './logging/request-logging.middleware.ts';

export interface CreateApiServerOptions {
  environment?: AppEnvironmentConfig;
  authService?: AuthService;
  healthService?: HealthService;
  logger?: AppLogger;
  configureRoutes?: (app: Express) => void;
}

export function createApiServer(options: CreateApiServerOptions = {}): Express {
  const app = express();
  let runtimeEnvironment = options.environment;

  if (!options.healthService && !runtimeEnvironment) {
    runtimeEnvironment = loadRuntimeEnvironmentConfig();
  }

  const healthService =
    options.healthService ??
    HealthService.fromEnvironment(runtimeEnvironment ?? loadRuntimeEnvironmentConfig());
  const logger =
    options.logger ??
    createAppLogger(
      runtimeEnvironment?.logging.level ?? (process.env.NODE_ENV === 'test' ? 'silent' : 'info'),
    );
  const authService =
    options.authService ??
    (runtimeEnvironment ? createAuthServiceFromEnvironment(runtimeEnvironment) : undefined);

  app.disable('x-powered-by');
  app.use(createRequestContextMiddleware());
  app.use(createRequestLoggingMiddleware(logger));
  app.use(express.json());
  app.use(createHealthRouter(healthService));
  if (authService) {
    app.use(createAuthRouter(authService));
  }
  options.configureRoutes?.(app);
  app.use(createNotFoundHandler());
  app.use(createErrorHandler(logger));

  return app;
}
