import type { BaseRequestContext } from './base-request-context.js';

export class HttpErrorHandler {
  handleError(error: any, ctx: BaseRequestContext): void | Promise<void> {
    throw error;
  }
}
