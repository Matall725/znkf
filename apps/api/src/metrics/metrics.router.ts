import { Router } from 'express';
import { z } from 'zod';
import type { AccessTokenVerifier } from '../auth/access-token.ts';
import { createAuthenticationMiddleware } from '../auth/auth.middleware.ts';
import { createRequireBackendPermissionMiddleware } from '../auth/permissions.ts';
import { BadRequestError } from '../errors/api-error.ts';
import type { MetricsService } from './metrics.service.ts';

const metricsOverviewQuerySchema = z
  .object({
    createdFrom: z.string().optional(),
    createdTo: z.string().optional(),
  })
  .strict();

export interface MetricsRouterOptions {
  service: MetricsService;
  accessTokenVerifier: AccessTokenVerifier;
}

export function createMetricsRouter(options: MetricsRouterOptions): Router {
  const router = Router();
  const authenticate = createAuthenticationMiddleware(options.accessTokenVerifier);
  const requireMetricsRead = createRequireBackendPermissionMiddleware('metrics:read');

  router.get(
    '/api/admin/metrics/overview',
    authenticate,
    requireMetricsRead,
    async (request, response, next) => {
      try {
        const query = parseMetricsQuery(request.query);
        const overview = await options.service.getOverview(query);

        response.status(200).json(overview);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}

function parseMetricsQuery(value: unknown): z.infer<typeof metricsOverviewQuerySchema> {
  const parsed = metricsOverviewQuerySchema.safeParse(value);

  if (!parsed.success) {
    throw new BadRequestError('Invalid metrics query.', {
      details: {
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
  }

  return parsed.data;
}
