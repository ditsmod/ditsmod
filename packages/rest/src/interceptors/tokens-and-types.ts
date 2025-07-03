import { RequestContext } from '#services/request-context.js';

/**
 * `HttpHandler` is injectable. When injected, the handler instance dispatches requests to the
 * first interceptor in the chain, which dispatches to the second, etc, eventually reaching the
 * `HttpBackend` and controller's method bounded to some route.
 *
 * In an `HttpInterceptor`, the `HttpHandler` parameter is the next interceptor in the chain.
 */
export abstract class HttpHandler {
  abstract handle(): Promise<any>;
}

export interface HttpInterceptor {
  intercept(next: HttpHandler, ctx: RequestContext): Promise<any>;
}

export class HttpInterceptorHandler implements HttpHandler {
  constructor(
    public interceptor: HttpInterceptor,
    public ctx: RequestContext,
    public next: HttpHandler,
  ) {}

  async handle(): Promise<any> {
    return this.interceptor.intercept(this.next, this.ctx);
  }
}

/**
 * A first `HttpHandler` which will dispatch the request to next interceptor in the chain.
 *
 * Interceptors sit between the `HttpFrontend` and the `HttpBackend`.
 */
export abstract class HttpFrontend implements HttpInterceptor {
  abstract intercept(next: HttpHandler, ctx: RequestContext): Promise<any>;
}

/**
 * A final `HttpHandler` which will dispatch the request to controller's route method.
 *
 * Interceptors sit between the `HttpFrontend` and the `HttpBackend`.
 *
 * When injected in an interceptor, `HttpBackend` can dispatches requests directly to
 * controller's route method, without going through the next interceptors in the chain.
 */
export abstract class HttpBackend implements HttpHandler {
  abstract handle(): Promise<any>;
}

export abstract class CtxHttpBackend {
  abstract handle(ctx: RequestContext): Promise<any>;
}
