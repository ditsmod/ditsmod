import { inject, injectable, optional } from '@ditsmod/core';

import {
  TrpcHttpBackend,
  TrpcHttpHandler,
  TrpcHttpInterceptor,
  TrpcHttpInterceptorHandler,
  RouteScopedTrpcHttpBackend,
} from './tokens-and-types.js';
import { TRPC_HTTP_INTERCEPTORS } from '#types/types.js';
import { TrpcOpts } from '#types/types.js';

class PreTrpcHttpBackend implements TrpcHttpBackend {
  constructor(
    protected backend: RouteScopedTrpcHttpBackend,
    protected trpcCtx: TrpcOpts,
  ) {}

  handle() {
    return this.backend.handle(this.trpcCtx);
  }
}

/**
 * An injectable service that ties multiple interceptors in chain.
 */
@injectable()
export class RouteScopedDefaultTrpcChainMaker {
  constructor(
    private backend: TrpcHttpBackend,
    @inject(TRPC_HTTP_INTERCEPTORS) @optional() private interceptors: TrpcHttpInterceptor[] = [],
  ) {}

  makeChain(opts: TrpcOpts): TrpcHttpHandler {
    return this.interceptors.reduceRight(
      (next, interceptor) => new TrpcHttpInterceptorHandler(interceptor, next, opts),
      new PreTrpcHttpBackend(this.backend, opts) as TrpcHttpBackend,
    );
  }
}
