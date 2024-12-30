import { inject, injectable, optional, RequestContext } from '@ditsmod/core';

import {
  HttpBackend,
  HttpHandler,
  HttpInterceptor,
  HttpInterceptorHandler,
  CtxHttpBackend,
} from './tokens-and-types.js';
import { HTTP_INTERCEPTORS } from '../constants.js';

class PreHttpBackend implements HttpBackend {
  constructor(
    protected backend: CtxHttpBackend,
    protected ctx: RequestContext,
  ) {}

  handle() {
    return this.backend.handle(this.ctx);
  }
}

/**
 * An injectable service that ties multiple interceptors in chain.
 */
@injectable()
export class DefaultCtxChainMaker {
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
