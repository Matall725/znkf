import type { RequestHandler } from 'express';
import { randomUUID } from 'node:crypto';
import { requestIdHeaderName, setRequestContext } from './request-context.ts';

function resolveRequestId(inboundRequestId: string | undefined): string {
  const trimmed = inboundRequestId?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : randomUUID();
}

export function createRequestContextMiddleware(): RequestHandler {
  return (request, response, next) => {
    const requestId = resolveRequestId(request.get(requestIdHeaderName));

    setRequestContext(request, {
      requestId,
      startedAt: Date.now(),
    });
    response.setHeader(requestIdHeaderName, requestId);

    next();
  };
}
