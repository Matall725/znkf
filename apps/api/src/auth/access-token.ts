import { accountStatuses, backendRoleCodes, type AuthenticatedAccount } from '@znkfxt/contracts';
import { createRequire } from 'node:module';
import { z } from 'zod';
import { UnauthenticatedError } from '../errors/api-error.ts';

const require = createRequire(import.meta.url);
const jsonwebtoken = require('jsonwebtoken') as typeof import('jsonwebtoken');

const accessTokenPayloadSchema = z
  .object({
    sub: z.string().min(1),
    loginName: z.string().min(1),
    displayName: z.string().min(1),
    status: z.enum(accountStatuses),
    roles: z.array(z.enum(backendRoleCodes)).min(1),
  })
  .passthrough();

export interface AccessTokenIssuer {
  readonly tokenType: 'Bearer';
  readonly expiresInSeconds: number;
  issueToken(account: AuthenticatedAccount): string;
}

export interface AccessTokenVerifier {
  verifyToken(token: string): AuthenticatedAccount;
}

export const defaultAccessTokenExpiresInSeconds = 60 * 60 * 2;

export class JwtAccessTokenIssuer implements AccessTokenIssuer {
  readonly tokenType = 'Bearer' as const;
  readonly expiresInSeconds: number;
  private readonly secret: string;

  constructor(secret: string, expiresInSeconds: number = defaultAccessTokenExpiresInSeconds) {
    this.secret = secret;
    this.expiresInSeconds = expiresInSeconds;
  }

  issueToken(account: AuthenticatedAccount): string {
    return jsonwebtoken.sign(
      {
        loginName: account.loginName,
        displayName: account.displayName,
        status: account.status,
        roles: account.roles,
      },
      this.secret,
      {
        algorithm: 'HS256',
        expiresIn: this.expiresInSeconds,
        subject: account.id,
      },
    );
  }
}

export class JwtAccessTokenVerifier implements AccessTokenVerifier {
  private readonly secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  verifyToken(token: string): AuthenticatedAccount {
    try {
      const payload = jsonwebtoken.verify(token, this.secret, {
        algorithms: ['HS256'],
      });

      if (typeof payload === 'string') {
        throw new Error('Access token payload must be a JSON object.');
      }

      const parsed = accessTokenPayloadSchema.parse(payload);

      return {
        id: parsed.sub,
        loginName: parsed.loginName,
        displayName: parsed.displayName,
        status: parsed.status,
        roles: parsed.roles,
      };
    } catch (error) {
      throw new UnauthenticatedError('Invalid or expired access token.', { cause: error });
    }
  }
}
