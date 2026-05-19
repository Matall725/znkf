import { Router } from 'express';
import type { CreateSatisfactionRatingRequest } from '@znkfxt/contracts';
import { z } from 'zod';
import { BadRequestError } from '../errors/api-error.ts';
import type { FeedbackService } from './feedback.service.ts';

const createRatingSchema = z
  .object({
    score: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
    comment: z.string().max(500).optional(),
  })
  .strict();

const conversationIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export interface FeedbackRouterOptions {
  service: FeedbackService;
}

export function createFeedbackRouter(options: FeedbackRouterOptions): Router {
  const router = Router();

  router.post('/api/visitor/conversations/:id/rating', async (request, response, next) => {
    try {
      const params = conversationIdParamsSchema.parse(request.params);
      const ratingRequest = parseCreateRatingRequest(request.body);
      const visitorId = extractVisitorId(request);

      const rating = await options.service.createSatisfactionRating(
        params.id,
        visitorId,
        ratingRequest,
      );

      response.status(201).json(rating);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function parseCreateRatingRequest(value: unknown): z.infer<typeof createRatingSchema> {
  const parsed = createRatingSchema.safeParse(value);

  if (!parsed.success) {
    throw new BadRequestError('Invalid satisfaction rating request.', {
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

function extractVisitorId(request: { header: (name: string) => string | undefined }): string {
  const visitorId = request.header('x-visitor-id');

  if (!visitorId) {
    throw new BadRequestError('x-visitor-id header is required.');
  }

  return visitorId;
}
