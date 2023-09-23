import { HTTP_INTERCEPTORS } from '#constans';
import { inject, injectable, optional } from '#di';
import {
  HttpBackend,
  HttpFrontend,
  HttpHandler,
  HttpInterceptor,
  HttpInterceptorHandler,
  InterceptorContext,
} from '#types/http-interceptor.js';

/**
 * An injectable `ChainMaker` that ties multiple interceptors in chain.
 */
@injectable()
export class ChainMaker {
  constructor(
    private frontend: HttpFrontend,
    private backend: HttpBackend,
    @inject(HTTP_INTERCEPTORS) @optional() private interceptors: HttpInterceptor[] = [],
  ) {}

  makeChain(ctx: InterceptorContext): HttpHandler {
    return [this.frontend, ...this.interceptors].reduceRight(
      (next, interceptor) => new HttpInterceptorHandler(interceptor, ctx, next),
      this.backend,
    );
  }
}
