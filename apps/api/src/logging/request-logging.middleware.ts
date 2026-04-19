import type { RequestHandler } from 'express';
import type { AppLogger } from './logger.ts';
import { getRequestContext } from './request-context.ts';

export function createRequestLoggingMiddleware(logger: AppLogger): RequestHandler {
  return (request, response, next) => {
    const context = getRequestContext(request);
    const requestId = context?.requestId ?? 'unknown';
    const startedAt = context?.startedAt ?? Date.now();

    logger.info(
      {
        event: 'request.start',
        requestId,
        method: request.method,
        path: request.path,
        originalUrl: request.originalUrl,
      },
      'request started',
    );

    response.on('finish', () => {
      logger.info(
        {
          event: 'request.finish',
          requestId,
          method: request.method,
          path: request.path,
          originalUrl: request.originalUrl,
          statusCode: response.statusCode,
          durationMs: Date.now() - startedAt,
        },
        'request completed',
      );
    });

    next();
  };
}
