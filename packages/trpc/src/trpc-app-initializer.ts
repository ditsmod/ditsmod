import { BaseAppInitializer, BaseMeta, ModRefId, ProvidersOnly, awaitTokens, isRootModule } from '@ditsmod/core';

import { RequestListener, SERVER, TrpcRootModule } from './types.js';
import { PreRouter } from './pre-router.js';
import { HttpServer } from './server-options.js';
import { t, TRPC_OPTS, TRPC_PROC, TRPC_ROOT } from './constants.js';
import { TrpcService } from './trpc.service.js';

export class TrpcAppInitializer extends BaseAppInitializer {
  protected preRouter: PreRouter;
  protected server: HttpServer;

  protected override addDefaultProvidersPerApp() {
    this.baseMeta.providersPerApp.unshift(
      PreRouter,
      { token: SERVER, useFactory: () => this.server },
      { token: TRPC_ROOT, useValue: t },
      { token: TRPC_PROC, useValue: t.procedure },
      ...awaitTokens(TRPC_OPTS),
    );
    super.addDefaultProvidersPerApp();
  }

  override async bootstrapModulesAndExtensions() {
    const injectorPerApp = await super.bootstrapModulesAndExtensions();
    this.preRouter = injectorPerApp.get(PreRouter) as PreRouter;
    return injectorPerApp;
  }

  requestListener: RequestListener = (rawReq, rawRes) => this.preRouter.requestListener(rawReq, rawRes);

  override async resetRequestListener() {
    const injectorPerMod = this.moduleManager.getInjectorPerMod('root');
    const trpcService = injectorPerMod.get(TrpcService) as TrpcService;
    trpcService.setTrpcRouter(this.baseMeta);
  }

  protected override overrideMetaAfterStage1(modRefId: ModRefId, baseMeta: ProvidersOnly): void {
    if (baseMeta instanceof BaseMeta) {
      baseMeta.providersPerMod.unshift(TrpcService);
    }
    super.overrideMetaAfterStage1(modRefId, baseMeta);
  }

  setServer(server: HttpServer) {
    this.server = server;
  }
}
