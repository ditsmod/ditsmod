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
} from '@ditsmod/core';

/**
 * An injectable service that ties multiple interceptors in chain.
 */
@injectable()
export class ChainMaker {
  constructor(
    private backend: HttpBackend,
    @inject(HTTP_INTERCEPTORS) @optional() private interceptors: HttpInterceptor[] = [],
  ) {}

  makeChain(ctx: RequestContext): HttpHandler {
    return this.interceptors.reduceRight(
      (next, interceptor) => new HttpInterceptorHandler(interceptor, ctx, next),
      this.backend,
    );
  }
}
