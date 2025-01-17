import { BaseAppInitializer } from '@ditsmod/core';

import { RequestListener } from './request.js';
import { PreRouter } from './pre-router.js';
import { HttpServer } from '#types/server-options.js';

export class AppInitializer extends BaseAppInitializer {
  protected preRouter: PreRouter;
  protected server: HttpServer;

  setServer(server: HttpServer) {
    this.server = server;
  }

  requestListener: RequestListener = (rawReq, rawRes) => this.preRouter.requestListener(rawReq, rawRes);
}
