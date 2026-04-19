import type { Request } from 'express';

export const requestIdHeaderName = 'x-request-id';

export interface RequestContext {
  requestId: string;
  startedAt: number;
}

declare module 'express-serve-static-core' {
  interface Request {
    requestContext?: RequestContext;
  }
}

export function setRequestContext(request: Request, context: RequestContext): void {
  request.requestContext = context;
}

export function getRequestContext(request: Request): RequestContext | undefined {
  return request.requestContext;
}

export function getRequestId(request: Request): string | undefined {
  return getRequestContext(request)?.requestId;
}
