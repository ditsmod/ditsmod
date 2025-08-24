import { BaseAppInitializer } from '@ditsmod/core';

import { RequestListener, SERVER } from './types.js';
import { PreRouter } from './pre-router.js';
import { HttpServer } from './server-options.js';
import { TRPC_OPTS } from './constants.js';
import { awaitTokens } from './utils.js';
import {
  TRPC_ROOT,
  t,
  TRPC_ROUTER,
  TRPC_PROCEDURE,
  TRPC_MERGE_ROUTERS,
  TRPC_CREATE_CALLER_FACTORY,
} from './root-rpc-object.js';

export class TrpcAppInitializer extends BaseAppInitializer {
  protected preRouter: PreRouter;
  protected server: HttpServer;

  setServer(server: HttpServer) {
    this.server = server;
  }

  requestListener: RequestListener = (rawReq, rawRes) => this.preRouter.requestListener(rawReq, rawRes);

  protected override addDefaultProvidersPerApp() {
    this.baseMeta.providersPerApp.unshift(
      PreRouter,
      { token: SERVER, useFactory: () => this.server },
      { token: TRPC_ROOT, useValue: t },
      { token: TRPC_ROUTER, useValue: t.router },
      { token: TRPC_PROCEDURE, useValue: t.procedure },
      { token: TRPC_MERGE_ROUTERS, useValue: t.mergeRouters },
      { token: TRPC_CREATE_CALLER_FACTORY, useValue: t.createCallerFactory },
      ...awaitTokens(TRPC_OPTS),
    );
    super.addDefaultProvidersPerApp();
  }

  override async bootstrapModulesAndExtensions() {
    const injectorPerApp = await super.bootstrapModulesAndExtensions();
    this.preRouter = injectorPerApp.get(PreRouter) as PreRouter;
    return injectorPerApp;
  }
}
