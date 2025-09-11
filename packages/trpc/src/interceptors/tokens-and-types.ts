import { TrpcOpts } from '#types/types.js';

/**
 * `TrpcHttpHandler` is injectable. When injected, the handler instance dispatches requests to the
 * first interceptor in the chain, which dispatches to the second, etc, eventually reaching the
 * `TrpcHttpBackend` and trpcController's method bounded to some route.
 *
 * In an `TrpcHttpInterceptor`, the `TrpcHttpHandler` parameter is the next interceptor in the chain.
 */
export abstract class TrpcHttpHandler {
  abstract handle(): Promise<any>;
}

export interface TrpcHttpInterceptor {
  intercept(next: TrpcHttpHandler, opts: TrpcOpts): Promise<any>;
}

export class TrpcHttpInterceptorHandler implements TrpcHttpHandler {
  constructor(
    public interceptor: TrpcHttpInterceptor,
    public opts: TrpcOpts,
    public next: TrpcHttpHandler,
  ) {}

  async handle(): Promise<any> {
    return this.interceptor.intercept(this.next, this.opts);
  }
}

/**
 * A first `TrpcHttpHandler` which will dispatch the request to next interceptor in the chain.
 *
 * Interceptors sit between the `TrpcHttpFrontend` and the `TrpcHttpBackend`.
 */
export abstract class TrpcHttpFrontend implements TrpcHttpInterceptor {
  abstract intercept(next: TrpcHttpHandler, opts: TrpcOpts): Promise<any>;
}

/**
 * A final `TrpcHttpHandler` which will dispatch the request to trpcController's route method.
 *
 * Interceptors sit between the `TrpcHttpFrontend` and the `TrpcHttpBackend`.
 *
 * When injected in an interceptor, `TrpcHttpBackend` can dispatches requests directly to
 * trpcController's route method, without going through the next interceptors in the chain.
 */
export abstract class TrpcHttpBackend implements TrpcHttpHandler {
  abstract handle(): Promise<any>;
}

export abstract class CtxTrpcHttpBackend {
  abstract handle(opts: TrpcOpts): Promise<any>;
}
