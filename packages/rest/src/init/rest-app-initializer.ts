import { BaseAppInitializer } from '@ditsmod/core';

import type { RequestListener } from '#services/request.js';
import { RequestDispatcher } from '#services/request-dispatcher.js';
import type { HttpServer } from '#types/server-options.js';
import { SERVER } from '../top/constants.js';

export class RestAppInitializer extends BaseAppInitializer {
  protected requestDispatcher: RequestDispatcher;
  protected server: HttpServer;

  setServer(server: HttpServer) {
    this.server = server;
  }

  requestListener: RequestListener = (rawReq, rawRes) => this.requestDispatcher.requestListener(rawReq, rawRes);

  protected override addDefaultProvidersPerApp() {
    this.normalizedModuleMeta.providersPerApp.unshift({ token: SERVER, useFactory: () => this.server });
    super.addDefaultProvidersPerApp();
  }

  override async bootstrapModulesAndExtensions() {
    const injectorPerApp = await super.bootstrapModulesAndExtensions();
    this.requestDispatcher = injectorPerApp.get(RequestDispatcher) as RequestDispatcher;
    return injectorPerApp;
  }
}
