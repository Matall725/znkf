import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { ApiErrorResponse } from '@znkfxt/contracts';
import type { AppLogger } from '../logging/logger.ts';
import { getRequestId } from '../logging/request-context.ts';
import { ApiError, BadRequestError, NotFoundError } from './api-error.ts';

interface HttpErrorLike {
  status?: number;
  statusCode?: number;
  type?: string;
}

function isJsonParseError(error: unknown): boolean {
  if (!(error instanceof SyntaxError) || typeof error !== 'object' || error === null) {
    return false;
  }

  const httpError = error as HttpErrorLike;
  return (
    httpError.status === 400 ||
    httpError.statusCode === 400 ||
    httpError.type === 'entity.parse.failed'
  );
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (isJsonParseError(error)) {
    return new BadRequestError('Invalid JSON request body.', { cause: error });
  }

  return new ApiError('INTERNAL_ERROR', 'Internal server error.', { cause: error });
}

export function createNotFoundHandler(): RequestHandler {
  return (request, _response, next) => {
    next(new NotFoundError(`Route ${request.method} ${request.path} was not found.`));
  };
}

function toErrorLogBindings(
  error: unknown,
  apiError: ApiError,
  requestId: string | undefined,
  method: string,
  path: string,
  originalUrl: string,
): Record<string, unknown> {
  const bindings: Record<string, unknown> = {
    event: 'request.error',
    method,
    path,
    originalUrl,
    code: apiError.code,
    statusCode: apiError.statusCode,
    ...(requestId === undefined ? {} : { requestId }),
  };

  if (error instanceof Error) {
    bindings.err = error;
  } else {
    bindings.error = error;
  }

  return bindings;
}

export function createErrorHandler(logger?: AppLogger): ErrorRequestHandler {
  return (error, request, response, next) => {
    if (response.headersSent) {
      next(error);
      return;
    }

    const apiError = normalizeApiError(error);
    const requestId = getRequestId(request);

    logger?.error(
      toErrorLogBindings(
        error,
        apiError,
        requestId,
        request.method,
        request.path,
        request.originalUrl,
      ),
      'request failed',
    );

    const body: ApiErrorResponse = {
      error: {
        code: apiError.code,
        message: apiError.message,
        statusCode: apiError.statusCode,
        ...(requestId === undefined ? {} : { requestId }),
        ...(apiError.details === undefined ? {} : { details: apiError.details }),
      },
    };

    response.status(apiError.statusCode).json(body);
  };
}
