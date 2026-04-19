import type { BackendRoleCode, LoginResponse } from '@znkfxt/contracts';
import { hash } from 'bcryptjs';
import { verify, type JwtPayload } from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { JwtAccessTokenIssuer } from '../src/auth/access-token';
import type { AuthAccountRecord, AuthAccountRepository } from '../src/auth/account.repository';
import { AuthService } from '../src/auth/auth.service';
import { BcryptPasswordVerifier } from '../src/auth/password-verifier';
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

class InMemoryAuthAccountRepository implements AuthAccountRepository {
  private readonly accounts: AuthAccountRecord[];

  constructor(accounts: AuthAccountRecord[]) {
    this.accounts = accounts;
  }

  async findByLoginName(loginName: string): Promise<AuthAccountRecord | null> {
    return this.accounts.find((account) => account.loginName === loginName) ?? null;
  }
}

async function createAccount(
  overrides: Partial<AuthAccountRecord> & { password: string },
): Promise<AuthAccountRecord> {
  const role: BackendRoleCode = 'admin';

  return {
    id: overrides.id ?? '00000000-0000-0000-0000-000000000001',
    loginName: overrides.loginName ?? 'admin@example.com',
    displayName: overrides.displayName ?? 'Admin User',
    passwordHash: await hash(overrides.password, 4),
    status: overrides.status ?? 'enabled',
    roles: overrides.roles ?? [role],
  };
}

function createTestServer(accounts: AuthAccountRecord[]) {
  return createApiServer({
    authService: new AuthService({
      accountRepository: new InMemoryAuthAccountRepository(accounts),
      passwordVerifier: new BcryptPasswordVerifier(),
      accessTokenIssuer: new JwtAccessTokenIssuer(jwtSecret, 3600),
    }),
    healthService: new HealthService([healthyCheck('database'), healthyCheck('redis')]),
    logger: noopLogger,
  });
}

describe('auth login route', () => {
  it('returns an access token for a valid enabled backend account', async () => {
    const account = await createAccount({
      password: 'correct-password',
      roles: ['admin', 'agent'],
    });
    const app = createTestServer([account]);

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        loginName: account.loginName,
        password: 'correct-password',
      })
      .expect(200);
    const body = response.body as LoginResponse;

    expect(body).toEqual({
      accessToken: expect.any(String),
      tokenType: 'Bearer',
      expiresInSeconds: 3600,
      account: {
        id: account.id,
        loginName: account.loginName,
        displayName: account.displayName,
        status: 'enabled',
        roles: ['admin', 'agent'],
      },
    });

    const decoded = verify(body.accessToken, jwtSecret) as JwtPayload;

    expect(decoded).toMatchObject({
      sub: account.id,
      loginName: account.loginName,
      displayName: account.displayName,
      roles: ['admin', 'agent'],
    });
  });

  it('rejects a valid account with an incorrect password', async () => {
    const account = await createAccount({
      password: 'correct-password',
    });
    const app = createTestServer([account]);

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        loginName: account.loginName,
        password: 'wrong-password',
      })
      .expect(401);

    expect(response.body).toEqual({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Invalid login name or password.',
        statusCode: 401,
        requestId: expect.any(String),
      },
    });
  });

  it('rejects a disabled account even when the password is correct', async () => {
    const account = await createAccount({
      password: 'correct-password',
      status: 'disabled',
    });
    const app = createTestServer([account]);

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        loginName: account.loginName,
        password: 'correct-password',
      })
      .expect(403);

    expect(response.body).toEqual({
      error: {
        code: 'FORBIDDEN',
        message: 'Account is disabled.',
        statusCode: 403,
        requestId: expect.any(String),
      },
    });
  });
});
