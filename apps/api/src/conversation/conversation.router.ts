import type {
  CreateConversationRequest,
  SendVisitorMessageRequest,
  SendAgentMessageRequest,
} from '@znkfxt/contracts';
import { Router } from 'express';
import { z } from 'zod';
import type { AccessTokenVerifier } from '../auth/access-token.ts';
import { createAuthenticationMiddleware } from '../auth/auth.middleware.ts';
import {
  getAuthenticatedAccount,
  requireAuthenticatedAccount,
} from '../auth/authenticated-account.ts';
import { createRequireBackendPermissionMiddleware } from '../auth/permissions.ts';
import { BadRequestError } from '../errors/api-error.ts';
import type { ConversationService } from './conversation.service.ts';

const conversationIdParamsSchema = z.object({
  id: z.string().uuid(),
});

const listMessagesQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .strict();

const listConversationsQuerySchema = z
  .object({
    status: z.string().optional(),
    visitorId: z.string().optional(),
    createdFrom: z.string().optional(),
    createdTo: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .strict();

const paginationQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .strict();

const createConversationSchema = z
  .object({
    visitorId: z.string().trim().min(1),
    source: z.enum(['web', 'h5']),
  })
  .strict();

const sendVisitorMessageSchema = z
  .object({
    content: z.string().trim().min(1).max(2000),
  })
  .strict();

const sendAgentMessageSchema = z
  .object({
    content: z.string().trim().min(1).max(2000),
  })
  .strict();

export interface ConversationRouterOptions {
  service: ConversationService;
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

export function createConversationRouter(options: ConversationRouterOptions): Router {
  const router = Router();
  const authenticate = createAuthenticationMiddleware(options.accessTokenVerifier);
  const requireConversationRead = createRequireBackendPermissionMiddleware('conversation:read');
  const requireConversationHandle = createRequireBackendPermissionMiddleware('conversation:handle');

  // ===== Visitor API (no auth) =====

  // Create or reuse conversation
  router.post('/api/visitor/conversations', async (request, response, next) => {
    try {
      const body = parseRequest(
        createConversationSchema,
        request.body,
        'Invalid create conversation request.',
      );
      const result = await options.service.createOrReuseConversation(body);

      response.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  // Send visitor message
  router.post('/api/visitor/conversations/:id/messages', async (request, response, next) => {
    try {
      const params = parseRequest(
        conversationIdParamsSchema,
        request.params,
        'Invalid conversation id.',
      );
      const body = parseRequest(
        sendVisitorMessageSchema,
        request.body,
        'Invalid visitor message request.',
      );
      const result = await options.service.sendVisitorMessage(params.id, body);

      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  // List messages
  router.get('/api/visitor/conversations/:id/messages', async (request, response, next) => {
    try {
      const params = parseRequest(
        conversationIdParamsSchema,
        request.params,
        'Invalid conversation id.',
      );
      const query = parseRequest(listMessagesQuerySchema, request.query, 'Invalid messages query.');
      const result = await options.service.listMessages(params.id, query);

      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  // Close conversation (visitor)
  router.post('/api/visitor/conversations/:id/close', async (request, response, next) => {
    try {
      const params = parseRequest(
        conversationIdParamsSchema,
        request.params,
        'Invalid conversation id.',
      );
      const result = await options.service.closeConversationByVisitor(params.id);

      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  // Request handoff
  router.post('/api/visitor/conversations/:id/handoff', async (request, response, next) => {
    try {
      const params = parseRequest(
        conversationIdParamsSchema,
        request.params,
        'Invalid conversation id.',
      );
      const result = await options.service.requestHandoff(params.id);

      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  // ===== Agent API (JWT + conversation:handle) =====

  // List waiting conversations
  router.get(
    '/api/agent/conversations/waiting',
    authenticate,
    requireConversationHandle,
    async (request, response, next) => {
      try {
        const query = parseRequest(
          paginationQuerySchema,
          request.query,
          'Invalid pagination query.',
        );
        const result = await options.service.listWaitingConversations(query);

        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  // Accept waiting conversation
  router.post(
    '/api/agent/conversations/:id/accept',
    authenticate,
    requireConversationHandle,
    async (request, response, next) => {
      try {
        const account = requireAuthenticatedAccount(request);
        const params = parseRequest(
          conversationIdParamsSchema,
          request.params,
          'Invalid conversation id.',
        );
        const result = await options.service.acceptWaitingConversation(params.id, account.id);

        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  // Send agent message
  router.post(
    '/api/agent/conversations/:id/messages',
    authenticate,
    requireConversationHandle,
    async (request, response, next) => {
      try {
        const account = requireAuthenticatedAccount(request);
        const params = parseRequest(
          conversationIdParamsSchema,
          request.params,
          'Invalid conversation id.',
        );
        const body = parseRequest(
          sendAgentMessageSchema,
          request.body,
          'Invalid agent message request.',
        );
        const result = await options.service.sendAgentMessage(params.id, account.id, body);

        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  // Close conversation (agent)
  router.post(
    '/api/agent/conversations/:id/close',
    authenticate,
    requireConversationHandle,
    async (request, response, next) => {
      try {
        const account = requireAuthenticatedAccount(request);
        const params = parseRequest(
          conversationIdParamsSchema,
          request.params,
          'Invalid conversation id.',
        );
        const result = await options.service.closeAgentConversation(params.id, account.id);

        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  // ===== Admin API (JWT + conversation:read) =====

  // List conversations
  router.get(
    '/api/admin/conversations',
    authenticate,
    requireConversationRead,
    async (request, response, next) => {
      try {
        const query = parseRequest(
          listConversationsQuerySchema,
          request.query,
          'Invalid conversations query.',
        );
        const result = await options.service.listConversations(query);

        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
