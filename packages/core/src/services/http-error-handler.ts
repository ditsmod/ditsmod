import { RequestContext } from '#types/http-interceptor.js';

export class HttpErrorHandler {
  handleError(error: any, ctx: RequestContext): void | Promise<void> {
    throw error;
  }
}
