import {
  HTTP_INTERCEPTORS,
  HttpBackend,
  HttpHandler,
  HttpInterceptor,
  HttpInterceptorHandler,
  inject,
  injectable,
  optional,
  RequestContext,
  SingletonHttpBackend,
  SingletonRequestContext,
} from '@ditsmod/core';

class PreHttpBackend implements HttpBackend {
  constructor(
    protected backend: SingletonHttpBackend,
    protected ctx: SingletonRequestContext,
  ) {}

  handle() {
    return this.backend.handle(this.ctx);
  }
}

/**
 * An injectable service that ties multiple interceptors in chain.
 */
@injectable()
export class DefaultSingletonChainMaker {
  constructor(
    private backend: HttpBackend,
    @inject(HTTP_INTERCEPTORS) @optional() private interceptors: HttpInterceptor[] = [],
  ) {}

  makeChain(ctx: RequestContext): HttpHandler {
    return this.interceptors.reduceRight(
      (next, interceptor) => new HttpInterceptorHandler(interceptor, ctx, next),
      new PreHttpBackend(this.backend, ctx) as HttpBackend,
    );
  }
}
