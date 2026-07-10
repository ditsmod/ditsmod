import type { ModRefId, ProvidersByLevel } from '@ditsmod/core';
import { BaseAppInitializer, NormalizedModuleMeta } from '@ditsmod/core';
import { initTRPC } from '@trpc/server';

import type { RequestListener, TrpcRootModule } from '../types/types.js';
import { SERVER } from '../types/types.js';
import { TrpcPreRouter } from '#services/pre-router.js';
import type { HttpServer } from '#types/server-options.js';
import { TRPC_ROOT } from '#types/constants.js';
import { TrpcInternalService } from '#services/trpc-internal.service.js';
import { TrpcService } from '#services/trpc.service.js';

export class TrpcAppInitializer extends BaseAppInitializer {
  protected preRouter: TrpcPreRouter;
  protected server: HttpServer;

  protected override addDefaultProvidersPerApp() {
    this.normalizedModuleMeta.providersPerApp.unshift(
      TrpcPreRouter,
      { token: SERVER, useFactory: () => this.server },
      {
        token: TRPC_ROOT,
        useFactory: () => this.getTrpcRootObject(),
      },
    );
    super.addDefaultProvidersPerApp();
  }

  protected getTrpcRootObject() {
    const mod = this.moduleManager.getInstanceOf('root', true) as Partial<TrpcRootModule>;
    return initTRPC.create(mod.setTrpcCreateOptions?.());
  }

  override async bootstrapModulesAndExtensions() {
    const injectorPerApp = await super.bootstrapModulesAndExtensions();
    this.preRouter = injectorPerApp.get(TrpcPreRouter) as TrpcPreRouter;
    return injectorPerApp;
  }

  requestListener: RequestListener = (rawReq, rawRes) => this.preRouter.requestListener(rawReq, rawRes);

  protected override overrideMetaAfterStage1(modRefId: ModRefId, normalizedModuleMeta: ProvidersByLevel): void {
    if (normalizedModuleMeta instanceof NormalizedModuleMeta) {
      normalizedModuleMeta.providersPerMod.unshift(TrpcService, TrpcInternalService);
    }
    super.overrideMetaAfterStage1(modRefId, normalizedModuleMeta);
  }

  async resetRequestListener() {
    const injectorPerMod = this.moduleManager.getInjectorPerMod('root', true);
    const trpcInternalService = injectorPerMod.get(TrpcInternalService) as TrpcInternalService;
    trpcInternalService.setTrpcRouter(this.normalizedModuleMeta);
  }

  setServer(server: HttpServer) {
    this.server = server;
  }
}
