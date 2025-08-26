import { BaseAppInitializer, BaseMeta, Injector, awaitTokens, getModule } from '@ditsmod/core';

import { RequestListener, SERVER } from './types.js';
import { PreRouter } from './pre-router.js';
import { HttpServer } from './server-options.js';
import { t, TRPC_OPTS, TRPC_PROC, TRPC_ROOT } from './constants.js';
import { TrpcService } from './trpc.service.js';
import { TrpcRootModule } from './utils.js';

export class TrpcAppInitializer extends BaseAppInitializer {
  protected preRouter: PreRouter;
  protected server: HttpServer;

  setServer(server: HttpServer) {
    this.server = server;
  }

  requestListener: RequestListener = (rawReq, rawRes) => this.preRouter.requestListener(rawReq, rawRes);

  protected override async initModuleAndGetInjectorPerMod(baseMeta: BaseMeta): Promise<Injector> {
    const injectorPerMod = await super.initModuleAndGetInjectorPerMod(baseMeta);
    const Mod = getModule(baseMeta.modRefId);
    (injectorPerMod.get(Mod) as Partial<TrpcRootModule>).getAppRouter?.();
    return injectorPerMod;
  }

  protected override addDefaultProvidersPerApp() {
    this.baseMeta.providersPerApp.unshift(
      PreRouter,
      TrpcService,
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
}
