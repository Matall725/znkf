import type { AuthenticatedAccount, LoginRequest, LoginResponse } from '@znkfxt/contracts';
import type { AppEnvironmentConfig } from '../config/environment.ts';
import { BadRequestError, ForbiddenError, UnauthenticatedError } from '../errors/api-error.ts';
import { JwtAccessTokenIssuer, type AccessTokenIssuer } from './access-token.ts';
import {
  PgAuthAccountRepository,
  type AuthAccountRecord,
  type AuthAccountRepository,
} from './account.repository.ts';
import { BcryptPasswordVerifier, type PasswordVerifier } from './password-verifier.ts';

export interface AuthServiceOptions {
  accountRepository: AuthAccountRepository;
  passwordVerifier: PasswordVerifier;
  accessTokenIssuer: AccessTokenIssuer;
}

function toPublicAccount(account: AuthAccountRecord): AuthenticatedAccount {
  return {
    id: account.id,
    loginName: account.loginName,
    displayName: account.displayName,
    status: account.status,
    roles: account.roles,
  };
}

export class AuthService {
  private readonly accountRepository: AuthAccountRepository;
  private readonly passwordVerifier: PasswordVerifier;
  private readonly accessTokenIssuer: AccessTokenIssuer;

  constructor(options: AuthServiceOptions) {
    this.accountRepository = options.accountRepository;
    this.passwordVerifier = options.passwordVerifier;
    this.accessTokenIssuer = options.accessTokenIssuer;
  }

  async login(request: LoginRequest): Promise<LoginResponse> {
    const loginName = request.loginName.trim();

    if (!loginName || request.password.length === 0) {
      throw new BadRequestError('loginName and password are required.');
    }

    const account = await this.accountRepository.findByLoginName(loginName);

    if (!account) {
      throw new UnauthenticatedError('Invalid login name or password.');
    }

    const passwordMatches = await this.passwordVerifier.verify(
      request.password,
      account.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthenticatedError('Invalid login name or password.');
    }

    if (account.status === 'disabled') {
      throw new ForbiddenError('Account is disabled.');
    }

    if (account.roles.length === 0) {
      throw new ForbiddenError('Account has no backend role.');
    }

    const publicAccount = toPublicAccount(account);

    return {
      accessToken: this.accessTokenIssuer.issueToken(publicAccount),
      tokenType: this.accessTokenIssuer.tokenType,
      expiresInSeconds: this.accessTokenIssuer.expiresInSeconds,
      account: publicAccount,
    };
  }
}

export function createAuthServiceFromEnvironment(environment: AppEnvironmentConfig): AuthService {
  return new AuthService({
    accountRepository: PgAuthAccountRepository.fromConnectionString(environment.database.url),
    passwordVerifier: new BcryptPasswordVerifier(),
    accessTokenIssuer: new JwtAccessTokenIssuer(environment.auth.jwtSecret),
  });
}
