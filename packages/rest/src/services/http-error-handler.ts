import type { RequestContext } from './request-context.js';

export class HttpErrorHandler {
  handleError(error: any, reqCtx: RequestContext): void | Promise<void> {
    throw error;
  }
}
