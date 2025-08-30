import { injectable, Injector, SystemLogMediator } from '@ditsmod/core';
import { createHTTPHandler } from '@trpc/server/adapters/standalone';

import { TRPC_OPTS } from './constants.js';
import { RequestListener, TrpcOpts } from './types.js';

@injectable()
export class PreRouter {
  protected opts: TrpcOpts;
  requestListener: RequestListener;

  constructor(
    protected injectorPerApp: Injector,
    protected systemLogMediator: SystemLogMediator,
  ) {}

  setTrpcRequestListener() {
    this.opts = this.injectorPerApp.get(TRPC_OPTS);
    this.requestListener = createHTTPHandler(this.opts) as RequestListener;
  }
}
