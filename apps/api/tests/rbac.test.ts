import {
  backendPermissions,
  type AuthenticatedAccount,
  type BackendRoleCode,
} from '@znkfxt/contracts';
import type { Express } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { JwtAccessTokenIssuer, JwtAccessTokenVerifier } from '../src/auth/access-token';
import { createAuthenticationMiddleware } from '../src/auth/auth.middleware';
import { getAuthenticatedAccount } from '../src/auth/authenticated-account';
import {
  createRequireBackendPermissionMiddleware,
  getBackendPermissionsForRoles,
} from '../src/auth/permissions';
import { HealthService } from '../src/health/health.service';
import type { HealthDependencyCheck } from '../src/health/health.types';
import type { AppLogger } from '../src/logging/logger';
import { createApiServer } from '../src/server';

const jwtSecret = 'test-jwt-secret-with-at-least-32-chars';

const healthyCheck = (name: HealthDependencyCheck['name']): HealthDependencyCheck => ({
  name,
  check: async () => ({
    status: 'ok',
    latencyMs: 1,
  }),
});

const noopLogger: AppLogger = {
  info() {
    return undefined;
  },
  error() {
    return undefined;
  },
};

function issueToken(roles: BackendRoleCode[]): string {
  const issuer = new JwtAccessTokenIssuer(jwtSecret, 3600);

  return issuer.issueToken({
    id: `account-${roles.join('-')}`,
    loginName: `${roles[0]}@example.com`,
    displayName: `${roles[0]} user`,
    status: 'enabled',
    roles,
  });
}

function createProtectedRoutes(app: Express): void {
  const authenticate = createAuthenticationMiddleware(new JwtAccessTokenVerifier(jwtSecret));

  app.put(
    '/api/admin/knowledge/articles/:id',
    authenticate,
    createRequireBackendPermissionMiddleware('knowledge:write'),
    (request, response) => {
      const account = getAuthenticatedAccount(request) as AuthenticatedAccount;

      response.status(200).json({
        account,
        permissions: getBackendPermissionsForRoles(account.roles),
      });
    },
  );

  app.post(
    '/api/agent/conversations/:id/accept',
    authenticate,
    createRequireBackendPermissionMiddleware('conversation:handle'),
    (_request, response) => {
      response.status(200).json({
        accepted: true,
      });
    },
  );
}

function createTestServer(): Express {
  return createApiServer({
    healthService: new HealthService([healthyCheck('database'), healthyCheck('redis')]),
    logger: noopLogger,
    configureRoutes: createProtectedRoutes,
  });
}

describe('RBAC middleware', () => {
  it('grants administrators every backend permission', () => {
    expect(getBackendPermissionsForRoles(['admin'])).toEqual([...backendPermissions]);
  });

  it('rejects an agent token on a knowledge editing route', async () => {
    const app = createTestServer();

    const response = await request(app)
      .put('/api/admin/knowledge/articles/article-1')
      .set('authorization', `Bearer ${issueToken(['agent'])}`)
      .send({
        title: 'ignored by permission middleware',
      })
      .expect(403);

    expect(response.body).toEqual({
      error: {
        code: 'FORBIDDEN',
        message: 'Permission denied.',
        statusCode: 403,
        requestId: expect.any(String),
      },
    });
  });

  it('allows a knowledge operator token on a knowledge editing route', async () => {
    const app = createTestServer();

    const response = await request(app)
      .put('/api/admin/knowledge/articles/article-1')
      .set('authorization', `Bearer ${issueToken(['knowledge_operator'])}`)
      .send({
        title: 'ignored by permission middleware',
      })
      .expect(200);

    expect(response.body).toEqual({
      account: {
        id: 'account-knowledge_operator',
        loginName: 'knowledge_operator@example.com',
        displayName: 'knowledge_operator user',
        status: 'enabled',
        roles: ['knowledge_operator'],
      },
      permissions: ['knowledge:read', 'knowledge:write', 'conversation:read', 'metrics:read'],
    });
  });

  it('rejects unauthenticated requests on backend protected routes', async () => {
    const app = createTestServer();

    const response = await request(app)
      .post('/api/agent/conversations/conversation-1/accept')
      .expect(401);

    expect(response.body).toEqual({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Bearer access token is required.',
        statusCode: 401,
        requestId: expect.any(String),
      },
    });
  });

  it('allows an agent token on a conversation handling route', async () => {
    const app = createTestServer();

    await request(app)
      .post('/api/agent/conversations/conversation-1/accept')
      .set('authorization', `Bearer ${issueToken(['agent'])}`)
      .expect(200)
      .expect({
        accepted: true,
      });
  });
});
