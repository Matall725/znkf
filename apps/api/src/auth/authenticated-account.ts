import type { AuthenticatedAccount } from '@znkfxt/contracts';
import type { Request } from 'express';
import { UnauthenticatedError } from '../errors/api-error.ts';

declare module 'express-serve-static-core' {
  interface Request {
    authenticatedAccount?: AuthenticatedAccount;
  }
}

export function setAuthenticatedAccount(request: Request, account: AuthenticatedAccount): void {
  request.authenticatedAccount = account;
}

export function getAuthenticatedAccount(request: Request): AuthenticatedAccount | undefined {
  return request.authenticatedAccount;
}

export function requireAuthenticatedAccount(request: Request): AuthenticatedAccount {
  const account = getAuthenticatedAccount(request);

  if (!account) {
    throw new UnauthenticatedError();
  }

  return account;
}
