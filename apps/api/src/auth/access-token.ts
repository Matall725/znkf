import type { AuthenticatedAccount } from '@znkfxt/contracts';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const jsonwebtoken = require('jsonwebtoken') as typeof import('jsonwebtoken');

export interface AccessTokenIssuer {
  readonly tokenType: 'Bearer';
  readonly expiresInSeconds: number;
  issueToken(account: AuthenticatedAccount): string;
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
