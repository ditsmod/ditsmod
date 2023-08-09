import {
  ExtensionsContext,
  ExtensionsManager,
  MetadataPerMod2,
  ModuleType,
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

@injectable()
export class TestingExtension extends PreRouterExtension {
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
    console.log('init TestingExtension');
    if (this.inited) {
      return;
    }

    this.isLastExtensionCall = isLastExtensionCall;
    const aMetadataPerMod2 = await this.extensionsManager.init(ROUTES_EXTENSIONS, true, PreRouterExtension);
    if (aMetadataPerMod2 === false) {
      this.inited = true;
      return;
    }
    this.addProviders(aMetadataPerMod2);
    const preparedRouteMeta = this.prepareRoutesMeta(aMetadataPerMod2);
    this.setRoutes(preparedRouteMeta);
    this.inited = true;
  }

  protected addProviders(aMetadataPerMod2: MetadataPerMod2[]) {
    aMetadataPerMod2.forEach((metadataPerMod2) => {
      const { aControllersMetadata2, providersPerMod } = metadataPerMod2;
      providersPerMod;
      metadataPerMod2.providersPerRou;
      metadataPerMod2.providersPerReq;
      this.testModuleManager.getProvidersToOverride();
      aControllersMetadata2.forEach(({ providersPerRou, providersPerReq }) => {
        providersPerRou;
        providersPerReq;
      });
    });
  }

  overrideProvidersInModule(module: ModuleType, providers: Provider[]): any {}

  overrideProviders(providers: Provider[]) {}
}
