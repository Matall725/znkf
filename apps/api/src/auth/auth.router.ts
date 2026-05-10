import type { LoginRequest } from '@znkfxt/contracts';
import { Router } from 'express';
import { z } from 'zod';
import { BadRequestError } from '../errors/api-error.ts';
import type { AuthService } from './auth.service.ts';

const loginRequestSchema = z
  .object({
    loginName: z.string().trim().min(1, 'loginName is required'),
    password: z.string().min(1, 'password is required'),
  })
  .strict();

function parseLoginRequest(body: unknown): LoginRequest {
  const parsed = loginRequestSchema.safeParse(body);

  if (!parsed.success) {
    throw new BadRequestError('loginName and password are required.', {
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

export function createAuthRouter(authService: AuthService): Router {
  const router = Router();

  router.post('/api/auth/login', async (request, response, next) => {
    try {
      const loginRequest = parseLoginRequest(request.body);
      const loginResponse = await authService.login(loginRequest);

      response.status(200).json(loginResponse);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
