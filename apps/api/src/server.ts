import express, { type Express } from 'express';
import { JwtAccessTokenVerifier, type AccessTokenVerifier } from './auth/access-token.ts';
import { createAuthRouter } from './auth/auth.router.ts';
import { createAuthServiceFromEnvironment, type AuthService } from './auth/auth.service.ts';
import type { AppEnvironmentConfig } from './config/environment.ts';
import { loadRuntimeEnvironmentConfig } from './config/runtime-environment.ts';
import { createConversationRouter } from './conversation/conversation.router.ts';
import {
  createConversationServiceFromConnectionString,
  type ConversationService,
} from './conversation/conversation.service.ts';
import { createErrorHandler, createNotFoundHandler } from './errors/error.middleware.ts';
import { createFeedbackRouter } from './feedback/feedback.router.ts';
import {
  createFeedbackServiceFromConnectionString,
  type FeedbackService,
} from './feedback/feedback.service.ts';
import { createHealthRouter } from './health/health.router.ts';
import { HealthService } from './health/health.service.ts';
import { createKnowledgeAnswerRouter } from './knowledge/answer.router.ts';
import {
  createKnowledgeAnswerServiceFromConnectionString,
  type KnowledgeAnswerService,
} from './knowledge/answer.service.ts';
import { createKnowledgeArticleRouter } from './knowledge/article.router.ts';
import {
  createKnowledgeArticleServiceFromConnectionString,
  type KnowledgeArticleService,
} from './knowledge/article.service.ts';
import { createKnowledgeCategoryRouter } from './knowledge/category.router.ts';
import {
  createKnowledgeCategoryServiceFromConnectionString,
  type KnowledgeCategoryService,
} from './knowledge/category.service.ts';
import { createAppLogger, type AppLogger } from './logging/logger.ts';
import { createRequestContextMiddleware } from './logging/request-context.middleware.ts';
import { createRequestLoggingMiddleware } from './logging/request-logging.middleware.ts';
import { createMetricsRouter } from './metrics/metrics.router.ts';
import {
  createMetricsServiceFromConnectionString,
  type MetricsService,
} from './metrics/metrics.service.ts';

export interface CreateApiServerOptions {
  environment?: AppEnvironmentConfig;
  accessTokenVerifier?: AccessTokenVerifier;
  authService?: AuthService;
  conversationService?: ConversationService;
  feedbackService?: FeedbackService;
  healthService?: HealthService;
  knowledgeAnswerService?: KnowledgeAnswerService;
  knowledgeArticleService?: KnowledgeArticleService;
  knowledgeCategoryService?: KnowledgeCategoryService;
  logger?: AppLogger;
  metricsService?: MetricsService;
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
  const accessTokenVerifier =
    options.accessTokenVerifier ??
    (runtimeEnvironment
      ? new JwtAccessTokenVerifier(runtimeEnvironment.auth.jwtSecret)
      : undefined);
  const knowledgeCategoryService =
    options.knowledgeCategoryService ??
    (runtimeEnvironment
      ? createKnowledgeCategoryServiceFromConnectionString(runtimeEnvironment.database.url)
      : undefined);
  const knowledgeAnswerService =
    options.knowledgeAnswerService ??
    (runtimeEnvironment
      ? createKnowledgeAnswerServiceFromConnectionString(runtimeEnvironment.database.url)
      : undefined);
  const knowledgeArticleService =
    options.knowledgeArticleService ??
    (runtimeEnvironment && knowledgeCategoryService
      ? createKnowledgeArticleServiceFromConnectionString(
          runtimeEnvironment.database.url,
          knowledgeCategoryService,
        )
      : undefined);
  const conversationService =
    options.conversationService ??
    (runtimeEnvironment
      ? createConversationServiceFromConnectionString(
          runtimeEnvironment.database.url,
          knowledgeAnswerService,
        )
      : undefined);
  const feedbackService =
    options.feedbackService ??
    (runtimeEnvironment
      ? createFeedbackServiceFromConnectionString(runtimeEnvironment.database.url)
      : undefined);
  const metricsService =
    options.metricsService ??
    (runtimeEnvironment
      ? createMetricsServiceFromConnectionString(runtimeEnvironment.database.url)
      : undefined);

  app.disable('x-powered-by');
  app.use(createRequestContextMiddleware());
  app.use(createRequestLoggingMiddleware(logger));
  app.use(express.json());
  app.use(createHealthRouter(healthService));
  if (authService) {
    app.use(createAuthRouter(authService));
  }
  if (knowledgeAnswerService) {
    app.use(createKnowledgeAnswerRouter({ service: knowledgeAnswerService }));
  }
  if (knowledgeCategoryService && accessTokenVerifier) {
    app.use(
      createKnowledgeCategoryRouter({
        service: knowledgeCategoryService,
        accessTokenVerifier,
      }),
    );
  }
  if (knowledgeArticleService && accessTokenVerifier) {
    app.use(
      createKnowledgeArticleRouter({
        service: knowledgeArticleService,
        accessTokenVerifier,
      }),
    );
  }
  if (conversationService && accessTokenVerifier) {
    app.use(
      createConversationRouter({
        service: conversationService,
        accessTokenVerifier,
      }),
    );
  }
  if (feedbackService) {
    app.use(createFeedbackRouter({ service: feedbackService }));
  }
  if (metricsService && accessTokenVerifier) {
    app.use(
      createMetricsRouter({
        service: metricsService,
        accessTokenVerifier,
      }),
    );
  }
  options.configureRoutes?.(app);
  app.use(createNotFoundHandler());
  app.use(createErrorHandler(logger));

  return app;
}
