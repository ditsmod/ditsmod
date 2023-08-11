import {
  ExtensionsContext,
  ExtensionsManager,
  MetadataPerMod2,
  normalizeProviders,
  PerAppService,
  PreRouterExtension,
  Provider,
  ROUTES_EXTENSIONS,
  Router,
  SystemLogMediator,
  forwardRef,
  inject,
  injectable,
} from '@ditsmod/core';

import { TestModuleManager } from './test-module-manager';
import { Scope, Meta } from './types';

@injectable()
export class TestPreRouterExtension extends PreRouterExtension {
  constructor(
    @inject(forwardRef(() => TestModuleManager)) protected testModuleManager: TestModuleManager,
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
    const providersToSetPerApp = this.testModuleManager.getProvidersToSetPerApp();
    this.perAppService.providers.push(...providersToSetPerApp);

    providersToOverride.forEach((provider) => {
      const providersPerApp = this.perAppService.providers;
      this.overrideProvider(['App'], { providersPerApp }, provider);
    });

    this.perAppService.reinitInjector();

    aMetadataPerMod2.forEach((metadataPerMod2) => {
      providersToOverride.forEach((provider) => {
        this.overrideProvider(['Mod', 'Rou', 'Req'], metadataPerMod2, provider);
      });
      metadataPerMod2.aControllersMetadata2.forEach((controllerMetadata2) => {
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
  protected overrideProvider(scopes: Scope[], metadata: Meta, provider: Provider) {
    scopes.forEach((scope) => {
      const normExistingProviders = normalizeProviders(metadata[`providersPer${scope}`] || []);
      const normProvider = normalizeProviders([provider])[0];
      if (normExistingProviders.some((p) => p.token === normProvider.token)) {
        metadata[`providersPer${scope}`]!.push(provider);
      }
    });
  }
}
