import { injectable, Injector, SystemLogMediator } from '@ditsmod/core';
import { createHTTPHandler } from '@trpc/server/adapters/standalone';

import { TRPC_OPTS } from './constants.js';
import { RequestListener, TrpcOpts } from './types.js';

@injectable()
export class PreRouter {
  protected opts: TrpcOpts;

  constructor(
    protected injectorPerApp: Injector,
    protected systemLogMediator: SystemLogMediator,
  ) {}

  readonly preRequestListener: RequestListener = (req, res) => {
    res.end('tRPC is initializing...');
  };

  setTrpcRequestListener() {
    this.opts = this.injectorPerApp.get(TRPC_OPTS);
    this.requestListener = createHTTPHandler(this.opts) as RequestListener;
  }

  requestListener: RequestListener = this.preRequestListener;
}
