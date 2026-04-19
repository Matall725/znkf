import { Router } from 'express';
import type { HealthService } from './health.service.ts';

export function createHealthRouter(healthService: HealthService): Router {
  const router = Router();

  router.get('/health', async (_request, response, next) => {
    try {
      const health = await healthService.getHealthReport();
      response.status(health.status === 'ok' ? 200 : 503).json(health);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
