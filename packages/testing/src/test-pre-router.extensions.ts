import {
  ExtensionsContext,
  ExtensionsManager,
  MetadataPerMod2,
  normalizeProviders,
  PerAppService,
  Router,
  SystemLogMediator,
  forwardRef,
  inject,
  injectable,
  isClassProvider,
  isFactoryProvider,
  getDependencies,
  ServiceProvider,
} from '@ditsmod/core';
import { PreRouterExtension, ROUTES_EXTENSIONS } from '@ditsmod/routing';

import { TestModuleManager, type TestModuleManager as TestModuleManagerType } from './test-module-manager.js';
import { Scope, Meta, TestProvider, TestFactoryProvider, TestClassProvider } from './types.js';
import { overrideLogLevel } from './utils.js';

@injectable()
export class TestPreRouterExtension extends PreRouterExtension {
  constructor(
    @inject(forwardRef(() => TestModuleManager)) protected testModuleManager: TestModuleManagerType,
    perAppService: PerAppService,
    router: Router,
    extensionsManager: ExtensionsManager,
    log: SystemLogMediator,
    extensionsContext: ExtensionsContext,
  ) {
    super(perAppService, router, extensionsManager, log, extensionsContext);
  }

  override async init(isLastExtensionCall: boolean) {
    if (this.inited) {
      return;
    }

    this.isLastExtensionCall = isLastExtensionCall;
    const aMetadataPerMod2 = await this.extensionsManager.init(ROUTES_EXTENSIONS, true, PreRouterExtension);
    if (aMetadataPerMod2 === false) {
      this.inited = true;
      return;
    }

    // Added only this line to override super.init()
    this.overrideAllProviders(aMetadataPerMod2);

    const preparedRouteMeta = this.prepareRoutesMeta(aMetadataPerMod2);
    this.setRoutes(preparedRouteMeta);
    this.inited = true;
  }

  protected overrideAllProviders(aMetadataPerMod2: MetadataPerMod2[]) {
    const providersToOverride = this.testModuleManager.getProvidersToOverride();
    const logLevel = this.testModuleManager.getLogLevel();
    overrideLogLevel(this.perAppService.providers, logLevel);

    providersToOverride.forEach((provider) => {
      const providersPerApp = this.perAppService.providers;
      this.overrideProvider(['App'], { providersPerApp }, provider);
    });

    this.perAppService.reinitInjector();

    aMetadataPerMod2.forEach((metadataPerMod2) => {
      overrideLogLevel(metadataPerMod2.providersPerMod, logLevel);
      overrideLogLevel(metadataPerMod2.providersPerRou, logLevel);
      overrideLogLevel(metadataPerMod2.providersPerReq, logLevel);
      providersToOverride.forEach((provider) => {
        this.overrideProvider(['Mod', 'Rou', 'Req'], metadataPerMod2, provider);
      });
      metadataPerMod2.aControllersMetadata2.forEach((controllerMetadata2) => {
        overrideLogLevel(controllerMetadata2.providersPerRou, logLevel);
        overrideLogLevel(controllerMetadata2.providersPerReq, logLevel);
        providersToOverride.forEach((provider) => {
          this.overrideProvider(['Rou', 'Req'], controllerMetadata2, provider);
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
    const allowedDeps: ServiceProvider[] = [];

    (provider.providers || []).forEach((preparedProvider) => {
      const { token } = normalizeProviders([preparedProvider])[0];
      if (tokensOfDeps.includes(token)) {
        allowedDeps.push(preparedProvider);
      }
    });

    return allowedDeps;
  }
}
