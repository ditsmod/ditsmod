import { InterceptorContext } from '#types/http-interceptor.js';

export class HttpErrorHandler {
  handleError(error: any, ctx: InterceptorContext): void | Promise<void> {
    throw error;
  }
}
