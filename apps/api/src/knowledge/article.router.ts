import {
  knowledgeArticleStatuses,
  knowledgeArticleTypes,
  type CreateKnowledgeArticleRequest,
  type UpdateKnowledgeArticleRequest,
} from '@znkfxt/contracts';
import { Router } from 'express';
import { z } from 'zod';
import type { AccessTokenVerifier } from '../auth/access-token.ts';
import { createAuthenticationMiddleware } from '../auth/auth.middleware.ts';
import { requireAuthenticatedAccount } from '../auth/authenticated-account.ts';
import { createRequireBackendPermissionMiddleware } from '../auth/permissions.ts';
import { BadRequestError } from '../errors/api-error.ts';
import type { KnowledgeArticleService } from './article.service.ts';

const createArticleSchema = z
  .object({
    articleType: z.enum(knowledgeArticleTypes).optional(),
    title: z.string().trim().min(1).max(240),
    content: z.string().trim().min(1),
    categoryId: z.string().uuid().nullable().optional(),
    keywords: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
    tagNames: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
    status: z.enum(knowledgeArticleStatuses).optional(),
  })
  .strict();

const articleIdParamsSchema = z.object({
  id: z.string().uuid(),
});

const updateArticleSchema = z
  .object({
    title: z.string().trim().min(1).max(240).optional(),
    content: z.string().trim().min(1).optional(),
    categoryId: z.string().uuid().nullable().optional(),
    keywords: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
    tagNames: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
    status: z.enum(knowledgeArticleStatuses).optional(),
  })
  .strict()
  .refine(
    (request) =>
      request.title !== undefined ||
      request.content !== undefined ||
      request.categoryId !== undefined ||
      request.keywords !== undefined ||
      request.tagNames !== undefined ||
      request.status !== undefined,
    {
      message: 'At least one editable field is required.',
    },
  );

export interface KnowledgeArticleRouterOptions {
  service: KnowledgeArticleService;
  accessTokenVerifier: AccessTokenVerifier;
}

function parseRequest<T>(schema: z.ZodType<T>, value: unknown, message: string): T {
  const parsed = schema.safeParse(value);

  if (!parsed.success) {
    throw new BadRequestError(message, {
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

export function createKnowledgeArticleRouter(options: KnowledgeArticleRouterOptions): Router {
  const router = Router();
  const authenticate = createAuthenticationMiddleware(options.accessTokenVerifier);
  const requireKnowledgeWrite = createRequireBackendPermissionMiddleware('knowledge:write');

  router.post(
    '/api/admin/knowledge/articles',
    authenticate,
    requireKnowledgeWrite,
    async (request, response, next) => {
      try {
        const account = requireAuthenticatedAccount(request);
        const articleRequest = parseRequest<CreateKnowledgeArticleRequest>(
          createArticleSchema,
          request.body,
          'Invalid knowledge article request.',
        );
        const article = await options.service.createArticle(articleRequest, account);

        response.status(201).json(article);
      } catch (error) {
        next(error);
      }
    },
  );

  router.put(
    '/api/admin/knowledge/articles/:id',
    authenticate,
    requireKnowledgeWrite,
    async (request, response, next) => {
      try {
        const account = requireAuthenticatedAccount(request);
        const params = parseRequest(
          articleIdParamsSchema,
          request.params,
          'Invalid knowledge article id.',
        );
        const articleRequest = parseRequest<UpdateKnowledgeArticleRequest>(
          updateArticleSchema,
          request.body,
          'Invalid knowledge article request.',
        );
        const article = await options.service.updateArticle(params.id, articleRequest, account);

        response.status(200).json(article);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
