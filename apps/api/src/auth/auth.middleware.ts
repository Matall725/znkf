import type { RequestHandler } from 'express';
import { UnauthenticatedError } from '../errors/api-error.ts';
import type { AccessTokenVerifier } from './access-token.ts';
import { setAuthenticatedAccount } from './authenticated-account.ts';

export function extractBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const segments = authorizationHeader.trim().split(/\s+/);
  const [scheme, token] = segments;

  if (segments.length !== 2 || scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

export function createAuthenticationMiddleware(
  accessTokenVerifier: AccessTokenVerifier,
): RequestHandler {
  return (request, _response, next) => {
    try {
      const token = extractBearerToken(request.header('authorization'));

      if (!token) {
        throw new UnauthenticatedError('Bearer access token is required.');
      }

      setAuthenticatedAccount(request, accessTokenVerifier.verifyToken(token));
      next();
    } catch (error) {
      next(error);
    }
  };
}
