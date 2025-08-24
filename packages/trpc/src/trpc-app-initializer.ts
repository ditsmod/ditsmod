import { BaseAppInitializer } from '@ditsmod/core';

import { RequestListener, SERVER } from './types.js';
import { PreRouter } from './pre-router.js';
import { HttpServer } from './server-options.js';

export class TrpcAppInitializer extends BaseAppInitializer {
  protected preRouter: PreRouter;
  protected server: HttpServer;

  setServer(server: HttpServer) {
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
