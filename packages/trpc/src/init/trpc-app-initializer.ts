import { BaseAppInitializer, BaseMeta, ModRefId, ProvidersOnly, awaitTokens } from '@ditsmod/core';
import { initTRPC } from '@trpc/server';

import { RequestListener, SERVER, TrpcRootModule } from '../types/types.js';
import { PreRouter } from '#services/pre-router.js';
import { HttpServer } from '#types/server-options.js';
import { TRPC_ROUTER_OPTS, TRPC_ROOT } from '#types/constants.js';
import { TrpcInternalService } from '#services/trpc-internal.service.js';
import { TrpcService } from '#services/trpc.service.js';

export class TrpcAppInitializer extends BaseAppInitializer {
  protected preRouter: PreRouter;
  protected server: HttpServer;

  protected override addDefaultProvidersPerApp() {
    this.baseMeta.providersPerApp.unshift(
      PreRouter,
      { token: SERVER, useFactory: () => this.server },
      {
        token: TRPC_ROOT,
        useFactory: () => this.getTrpcRootObject(),
      },
      ...awaitTokens([TRPC_ROUTER_OPTS]),
    );
    super.addDefaultProvidersPerApp();
  }

  protected getTrpcRootObject() {
    const mod = this.moduleManager.getInstanceOf('root', true) as Partial<TrpcRootModule>;
    return initTRPC.create(mod.setTrpcCreateOptions?.());
  }

  override async bootstrapModulesAndExtensions() {
    const injectorPerApp = await super.bootstrapModulesAndExtensions();
    this.preRouter = injectorPerApp.get(PreRouter) as PreRouter;
    return injectorPerApp;
  }

  requestListener: RequestListener = (rawReq, rawRes) => this.preRouter.requestListener(rawReq, rawRes);

  protected override overrideMetaAfterStage1(modRefId: ModRefId, baseMeta: ProvidersOnly): void {
    if (baseMeta instanceof BaseMeta) {
      baseMeta.providersPerMod.unshift(TrpcService, TrpcInternalService);
    }
    super.overrideMetaAfterStage1(modRefId, baseMeta);
  }

  override async resetRequestListener() {
    const injectorPerMod = this.moduleManager.getInjectorPerMod('root', true);
    const trpcInternalService = injectorPerMod.get(TrpcInternalService) as TrpcInternalService;
    trpcInternalService.setTrpcRouter(this.baseMeta);
  }

  setServer(server: HttpServer) {
    this.server = server;
  }
}
