import { inject, injectable, optional } from '@ditsmod/core';

import {
  HttpBackend,
  HttpHandler,
  HttpInterceptor,
  HttpInterceptorHandler,
  RouteScopedHttpBackend,
} from './tokens-and-types.js';
import { HTTP_INTERCEPTORS } from '#types/constants.js';
import { RequestContext } from '#services/request-context.js';

class PreHttpBackend implements HttpBackend {
  constructor(
    protected backend: RouteScopedHttpBackend,
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
export class RouteScopedDefaultChainMaker {
  constructor(
    private backend: HttpBackend,
    @inject(HTTP_INTERCEPTORS) @optional() private interceptors: HttpInterceptor[] = [],
  ) {}

  makeChain(ctx: RequestContext): HttpHandler {
    return this.interceptors.reduceRight(
      (next, interceptor) => new HttpInterceptorHandler(interceptor, next, ctx),
      new PreHttpBackend(this.backend, ctx) as HttpBackend,
    );
  }
}
