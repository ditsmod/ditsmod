import { Res } from '#services/response.js';
import { AnyObj } from './mix.js';
import { PathParam } from './router.js';
import { NodeRequest, NodeResponse } from './server-options.js';

/**
 * The request context class, which you can substitute with your own class.
 * You can do this at any level, but remember that your class must implement `RequestContext`
 * and must also be passed to the DI registry as a `ValueProvider`
 * like this: `{ token: RequestContext, useValue: MyRequestContext }`.
 * 
 * An instance of this class is created without DI.
 */
export class RequestContext extends Res {
  constructor(
    public nodeReq: NodeRequest,
    public override nodeRes: NodeResponse,
    public aPathParams: PathParam[],
    public queryString: string,
  ) {
    super(nodeRes);
  }
}

export class SingletonRequestContext extends RequestContext {
  pathParams?: AnyObj;
  queryParams?: AnyObj;
  body?: AnyObj;
  auth?: AnyObj;
}

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

export abstract class SingletonHttpBackend {
  abstract handle(ctx: SingletonRequestContext): Promise<any>;
}
