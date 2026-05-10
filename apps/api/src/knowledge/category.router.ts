import { knowledgeCategoryStatuses, type UpdateKnowledgeCategoryRequest } from '@znkfxt/contracts';
import { Router } from 'express';
import { z } from 'zod';
import type { AccessTokenVerifier } from '../auth/access-token.ts';
import { createAuthenticationMiddleware } from '../auth/auth.middleware.ts';
import { requireAuthenticatedAccount } from '../auth/authenticated-account.ts';
import { createRequireBackendPermissionMiddleware } from '../auth/permissions.ts';
import { BadRequestError } from '../errors/api-error.ts';
import type { KnowledgeCategoryService } from './category.service.ts';

const categorySlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const categoryIdParamsSchema = z.object({
  id: z.string().uuid(),
});

const createCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    slug: z.string().trim().min(1).max(140).regex(categorySlugPattern),
  })
  .strict();

const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    slug: z.string().trim().min(1).max(140).regex(categorySlugPattern).optional(),
  })
  .strict()
  .refine((request) => request.name !== undefined || request.slug !== undefined, {
    message: 'At least one editable field is required.',
  });

const listCategoriesSchema = z
  .object({
    status: z.enum(knowledgeCategoryStatuses).optional(),
  })
  .strict();

export interface KnowledgeCategoryRouterOptions {
  service: KnowledgeCategoryService;
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

export function createKnowledgeCategoryRouter(options: KnowledgeCategoryRouterOptions): Router {
  const router = Router();
  const authenticate = createAuthenticationMiddleware(options.accessTokenVerifier);
  const requireKnowledgeRead = createRequireBackendPermissionMiddleware('knowledge:read');
  const requireKnowledgeWrite = createRequireBackendPermissionMiddleware('knowledge:write');

  router.get(
    '/api/admin/knowledge/categories',
    authenticate,
    requireKnowledgeRead,
    async (request, response, next) => {
      try {
        const query = parseRequest(
          listCategoriesSchema,
          request.query,
          'Invalid knowledge category query.',
        );
        const categories = await options.service.listCategories(query);

        response.status(200).json({
          categories,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    '/api/admin/knowledge/categories',
    authenticate,
    requireKnowledgeWrite,
    async (request, response, next) => {
      try {
        const account = requireAuthenticatedAccount(request);
        const categoryRequest = parseRequest(
          createCategorySchema,
          request.body,
          'Invalid knowledge category request.',
        );
        const category = await options.service.createCategory(categoryRequest, account.id);

        response.status(201).json(category);
      } catch (error) {
        next(error);
      }
    },
  );

  router.put(
    '/api/admin/knowledge/categories/:id',
    authenticate,
    requireKnowledgeWrite,
    async (request, response, next) => {
      try {
        const account = requireAuthenticatedAccount(request);
        const params = parseRequest(
          categoryIdParamsSchema,
          request.params,
          'Invalid knowledge category id.',
        );
        const categoryRequest = parseRequest<UpdateKnowledgeCategoryRequest>(
          updateCategorySchema,
          request.body,
          'Invalid knowledge category request.',
        );
        const category = await options.service.updateCategory(
          params.id,
          categoryRequest,
          account.id,
        );

        response.status(200).json(category);
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    '/api/admin/knowledge/categories/:id/disable',
    authenticate,
    requireKnowledgeWrite,
    async (request, response, next) => {
      try {
        const account = requireAuthenticatedAccount(request);
        const params = parseRequest(
          categoryIdParamsSchema,
          request.params,
          'Invalid knowledge category id.',
        );
        const category = await options.service.disableCategory(params.id, account.id);

        response.status(200).json(category);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
