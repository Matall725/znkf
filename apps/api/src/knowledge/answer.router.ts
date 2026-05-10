import type { KnowledgeAnswerRequest } from '@znkfxt/contracts';
import { Router } from 'express';
import { z } from 'zod';
import { BadRequestError } from '../errors/api-error.ts';
import type { KnowledgeAnswerService } from './answer.service.ts';

const answerRequestSchema = z
  .object({
    question: z.string().trim().min(1).max(1000),
  })
  .strict();

export interface KnowledgeAnswerRouterOptions {
  service: KnowledgeAnswerService;
}

function parseAnswerRequest(value: unknown): KnowledgeAnswerRequest {
  const parsed = answerRequestSchema.safeParse(value);

  if (!parsed.success) {
    throw new BadRequestError('Invalid knowledge answer request.', {
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

export function createKnowledgeAnswerRouter(options: KnowledgeAnswerRouterOptions): Router {
  const router = Router();

  router.post('/api/knowledge/answer', async (request, response, next) => {
    try {
      const answerRequest = parseAnswerRequest(request.body);
      const answer = await options.service.answerQuestion(answerRequest);

      response.status(200).json(answer);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
