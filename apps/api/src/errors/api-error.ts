import type { ApiErrorCode } from '@znkfxt/contracts';

export const apiErrorStatusByCode: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

export interface ApiErrorOptions {
  details?: unknown;
  cause?: unknown;
}

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(code: ApiErrorCode, message: string, options: ApiErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = apiErrorStatusByCode[code];
    this.details = options.details;
  }
}

export class BadRequestError extends ApiError {
  constructor(message = 'Invalid request parameters.', options?: ApiErrorOptions) {
    super('BAD_REQUEST', message, options);
  }
}

export class UnauthenticatedError extends ApiError {
  constructor(message = 'Authentication is required.', options?: ApiErrorOptions) {
    super('UNAUTHENTICATED', message, options);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Permission denied.', options?: ApiErrorOptions) {
    super('FORBIDDEN', message, options);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found.', options?: ApiErrorOptions) {
    super('NOT_FOUND', message, options);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Resource state conflict.', options?: ApiErrorOptions) {
    super('CONFLICT', message, options);
  }
}
