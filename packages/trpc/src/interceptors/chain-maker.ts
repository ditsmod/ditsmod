import { inject, injectable, optional } from '@ditsmod/core';

import { TrpcHttpBackend, TrpcHttpInterceptor, TrpcHttpHandler, TrpcHttpInterceptorHandler } from './tokens-and-types.js';
import { TRPC_HTTP_INTERCEPTORS } from '#types/types.js';
import { TrpcOpts } from '#types/types.js';

/**
 * An injectable service that ties multiple interceptors in chain.
 */
@injectable()
export class TrpcChainMaker {
  constructor(
    private backend: TrpcHttpBackend,
    @inject(TRPC_HTTP_INTERCEPTORS) @optional() private interceptors: TrpcHttpInterceptor[] = [],
  ) {}

  makeChain(opts: TrpcOpts): TrpcHttpHandler {
    return this.interceptors.reduceRight(
      (next, interceptor) => new TrpcHttpInterceptorHandler(interceptor, opts, next),
      this.backend,
    );
  }
}
