import { BaseAppInitializer } from '@ditsmod/core';
import { RequestListener, Server } from 'node:http';

import { SERVER } from './types.js';
import { PreRouter } from './pre-router.js';

export class TrpcAppInitializer extends BaseAppInitializer {
  protected preRouter: PreRouter;
  protected server: Server;

  setServer(server: Server) {
    this.server = server;
  }

  requestListener: RequestListener = (rawReq, rawRes) => this.preRouter.requestListener(rawReq, rawRes);

  protected override addDefaultProvidersPerApp() {
    this.baseMeta.providersPerApp.unshift({ token: SERVER, useFactory: () => this.server });
    super.addDefaultProvidersPerApp();
  }

  override async bootstrapModulesAndExtensions() {
    const injectorPerApp = await super.bootstrapModulesAndExtensions();
    this.preRouter = injectorPerApp.get(PreRouter) as PreRouter;
    return injectorPerApp;
  }
}
