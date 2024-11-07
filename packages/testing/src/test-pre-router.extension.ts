import {
  ExtensionsContext,
  ExtensionsManager,
  normalizeProviders,
  PerAppService,
  Router,
  SystemLogMediator,
  injectable,
  isClassProvider,
  isFactoryProvider,
  getDependencies,
  Provider,
  TotalInitMetaPerApp,
  ModuleManager,
} from '@ditsmod/core';
import { PreRouterExtension, RoutingErrorMediator, ROUTES_EXTENSIONS, MetadataPerMod3 } from '@ditsmod/routing';

import { TestModuleManager } from './test-module-manager.js';
import { Scope, Meta, TestProvider, TestFactoryProvider, TestClassProvider } from './types.js';
import { overrideLogLevel } from './utils.js';

@injectable()
export class TestPreRouterExtension extends PreRouterExtension {
  constructor(
    protected testModuleManager: TestModuleManager,
    perAppService: PerAppService,
    router: Router,
    extensionsManager: ExtensionsManager,
    moduleManager: ModuleManager,
    log: SystemLogMediator,
    extensionsContext: ExtensionsContext,
    routerErrorMediator: RoutingErrorMediator,
  ) {
    super(perAppService, router, extensionsManager, moduleManager, log, extensionsContext, routerErrorMediator);
  }

  override async stage3() {
    // Added only this line to override super.stage3()
    this.overrideAllProviders(this.totalInitMeta.totalInitMetaPerApp);

    await super.stage3();
  }

  protected overrideAllProviders(totalInitMetaPerApp: TotalInitMetaPerApp<MetadataPerMod3>[]) {
    const providersToOverride = this.testModuleManager.getProvidersToOverride();
    const logLevel = this.testModuleManager.getLogLevel();
    overrideLogLevel(this.perAppService.providers, logLevel);

    providersToOverride.forEach((provider) => {
      const providersPerApp = this.perAppService.providers;
      this.overrideProvider(['App'], { providersPerApp }, provider);
    });

    this.perAppService.reinitInjector();

    totalInitMetaPerApp.forEach((totalInitMeta) => {
      totalInitMeta.groupInitMeta.forEach((initMeta) => {
        const metadataPerMod3 = initMeta.payload;
        overrideLogLevel(metadataPerMod3.meta.providersPerMod, logLevel);
        overrideLogLevel(metadataPerMod3.meta.providersPerRou, logLevel);
        overrideLogLevel(metadataPerMod3.meta.providersPerReq, logLevel);
        providersToOverride.forEach((provider) => {
          this.overrideProvider(['Mod', 'Rou', 'Req'], metadataPerMod3.meta, provider);
        });
        metadataPerMod3.aControllerMetadata.forEach((controllerMetadata) => {
          overrideLogLevel(controllerMetadata.providersPerRou, logLevel);
          overrideLogLevel(controllerMetadata.providersPerReq, logLevel);
          providersToOverride.forEach((provider) => {
            this.overrideProvider(['Rou', 'Req'], controllerMetadata, provider);
          });
        });
      });
    });
  }

  /**
   * If the token of the `provider` that needs to be overridden is found in the `metadata`,
   * that `provider` is added to the `metadata` array last in the same scope.
   */
  protected overrideProvider(scopes: Scope[], metadata: Meta, provider: TestProvider) {
    scopes.forEach((scope) => {
      const normExistingProviders = normalizeProviders(metadata[`providersPer${scope}`] || []);
      const normProvider = normalizeProviders([provider])[0];
      if (normExistingProviders.some((p) => p.token === normProvider.token)) {
        metadata[`providersPer${scope}`]!.push(provider);
        if (isClassProvider(provider) || isFactoryProvider(provider)) {
          const allowedDeps = this.getAllowedDeps(provider);
          metadata[`providersPer${scope}`]!.push(...allowedDeps);
        }
      }
    });
  }

  /**
   * We don't want to blindly add all the providers that are in the `provider.providers` property,
   * as this can lead to unwanted results. We first need to check if the current provider depends
   * on the prepared providers, and if it does, then only add them at the same scope.
   */
  protected getAllowedDeps(provider: TestClassProvider | TestFactoryProvider) {
    const tokensOfDeps = getDependencies(provider).map((reflectiveDependecy) => reflectiveDependecy.token);
    const allowedDeps: Provider[] = [];

    (provider.providers || []).forEach((preparedProvider) => {
      const { token } = normalizeProviders([preparedProvider])[0];
      if (tokensOfDeps.includes(token)) {
        allowedDeps.push(preparedProvider);
      }
    });

    return allowedDeps;
  }
}
