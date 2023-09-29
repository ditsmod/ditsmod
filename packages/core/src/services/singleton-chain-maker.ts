import { HTTP_INTERCEPTORS } from '#constans';
import { inject, injectable, optional } from '#di';
import {
  HttpBackend,
  HttpHandler,
  HttpInterceptor,
  HttpInterceptorHandler,
  RequestContext,
} from '#types/http-interceptor.js';

/**
 * An injectable service that ties multiple interceptors in chain.
 */
@injectable()
export class SingletonChainMaker {
  constructor(
    private backend: HttpBackend,
    @inject(HTTP_INTERCEPTORS) @optional() private interceptors: HttpInterceptor[] = [],
  ) {}

  makeChain(ctx: RequestContext): HttpHandler {
    this.backend.ctx = ctx;
    return this.interceptors.reduceRight(
      (next, interceptor) => new HttpInterceptorHandler(interceptor, ctx, next),
      this.backend,
    );
  }
}
