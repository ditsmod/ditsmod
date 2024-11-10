import { HTTP_INTERCEPTORS } from '#constans';
import { inject, injectable, optional } from '#di';
import { HttpBackend, HttpHandler, HttpInterceptor, HttpInterceptorHandler } from '#interceptors/tokens-and-types.js';
import { RequestContext } from '#core/request-context.js';

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
