import { HTTP_INTERCEPTORS } from '#constans';
import { inject, injectable, optional } from '#di';
import {
  HttpBackend,
  HttpHandler,
  HttpInterceptor,
  HttpInterceptorHandler,
  SingletonHttpBackend,
} from '#interceptors/tokens-and-types.js';
import { RequestContext, SingletonRequestContext } from '#core/request-context.js';

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
