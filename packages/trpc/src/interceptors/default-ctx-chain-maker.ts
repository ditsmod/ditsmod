import { inject, injectable, optional } from '@ditsmod/core';

import {
  HttpBackend,
  HttpHandler,
  HttpInterceptor,
  HttpInterceptorHandler,
  CtxHttpBackend,
} from './tokens-and-types.js';
import { HTTP_INTERCEPTORS } from '#types/types.js';
import { TrpcOpts } from '#types/constants.js';

class PreHttpBackend implements HttpBackend {
  constructor(
    protected backend: CtxHttpBackend,
    protected ctx: TrpcOpts,
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

  makeChain(opts: TrpcOpts): HttpHandler {
    return this.interceptors.reduceRight(
      (next, interceptor) => new HttpInterceptorHandler(interceptor, opts, next),
      new PreHttpBackend(this.backend, opts) as HttpBackend,
    );
  }
}
