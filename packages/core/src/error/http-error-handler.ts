import { RequestContext } from '#interceptors/tokens-and-types.js';

export class HttpErrorHandler {
  handleError(error: any, ctx: RequestContext): void | Promise<void> {
    throw error;
  }
}
