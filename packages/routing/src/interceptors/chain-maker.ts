import { inject, injectable, optional } from '@ditsmod/core';

import { HttpBackend, HttpInterceptor, HttpHandler, HttpInterceptorHandler } from './tokens-and-types.js';
import { HTTP_INTERCEPTORS } from '../constants.js';
import { RequestContext } from '#services/request-context.js';

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
