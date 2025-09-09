import { inject, injectable, optional } from '@ditsmod/core';

import { HttpBackend, HttpInterceptor, HttpHandler, HttpInterceptorHandler } from './tokens-and-types.js';
import { HTTP_INTERCEPTORS } from '#types/types.js';
import { TrpcOpts } from '#types/types.js';

/**
 * An injectable service that ties multiple interceptors in chain.
 */
@injectable()
export class ChainMaker {
  constructor(
    private backend: HttpBackend,
    @inject(HTTP_INTERCEPTORS) @optional() private interceptors: HttpInterceptor[] = [],
  ) {}

  makeChain(opts: TrpcOpts): HttpHandler {
    return this.interceptors.reduceRight(
      (next, interceptor) => new HttpInterceptorHandler(interceptor, opts, next),
      this.backend,
    );
  }
}
