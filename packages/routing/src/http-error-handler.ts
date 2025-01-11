import { RequestContext } from './request-context.js';

export class HttpErrorHandler {
  handleError(error: any, ctx: RequestContext): void | Promise<void> {
    throw error;
  }
}
