import {
  AppInitializer,
  AppOptions,
  ExtensionCounters,
  featureModule,
  injectable,
  Logger,
  MetadataPerMod1,
  ModuleExtract,
  ModuleManager,
  ModuleType,
  ModuleWithParams,
  NormalizedMeta,
  Provider,
  rootModule,
  SystemLogMediator,
} from '@ditsmod/core';
import { beforeAll, describe, expect, it } from 'vitest';

import { controller } from './controller.js';
import { ImportObj } from './module/module-factory.spec.js';
import { Router } from './services/router.js';

function getImportedTokens(map: Map<any, ImportObj<Provider>> | undefined) {
  return [...(map || [])].map(([key]) => key);
}

type ModRefId = ModuleType | ModuleWithParams;

@injectable()
class AppInitializerMock extends AppInitializer {
  override meta = new NormalizedMeta();

  constructor(
    public override appOptions: AppOptions,
    public override moduleManager: ModuleManager,
    public override systemLogMediator: SystemLogMediator,
  ) {
    super(appOptions, moduleManager, systemLogMediator);
  }

  async init() {
    this.bootstrapProvidersPerApp();
    await this.bootstrapModulesAndExtensions();
  }

  override collectProvidersPerApp(meta: NormalizedMeta) {
    return super.collectProvidersPerApp(meta);
  }

  override prepareProvidersPerApp() {
    return super.prepareProvidersPerApp();
  }

  override bootstrapModuleFactory(moduleManager: ModuleManager) {
    return super.bootstrapModuleFactory(moduleManager);
  }

  override getResolvedCollisionsPerApp() {
    return super.getResolvedCollisionsPerApp();
  }

  override decreaseExtensionsCounters(extensionCounters: ExtensionCounters, providers: Provider[]) {
    return super.decreaseExtensionsCounters(extensionCounters, providers);
  }
}

let mock: AppInitializerMock;
let moduleManager: ModuleManager;

describe('exports/imports', () => {
  class Provider0 {}
  class Provider1 {}
  class Provider2 {}
  class Provider3 {}
  class Provider4 {}
  class Provider5 {}
  class Provider6 {}
  class Provider7 {}
  class Provider8 {}
  class Provider9 {}

  @controller()
  class Ctrl {}

  @featureModule({
    exports: [Provider0],
    providersPerMod: [Provider0],
  })
  class Module0 {}

  const obj1 = { token: Provider1, useClass: Provider1 };
  @featureModule({
    controllers: [Ctrl],
    providersPerMod: [obj1, Provider2],
    exports: [Provider1],
  })
  class Module1 {}

  @featureModule({
    providersPerMod: [Provider3, Provider4],
    exports: [Provider3, Provider4],
  })
  class Module2 {
    static withParams() {
      return { module: Module2 };
    }
  }

  @featureModule({
    providersPerReq: [Provider5, Provider6, Provider7],
    exports: [Provider5, Provider6, Provider7],
  })
  class Module3 {}

  @featureModule({
    providersPerReq: [Provider8, Provider9],
    exports: [Provider8, Provider9],
  })
  class Module4 {}

  @featureModule({
    providersPerApp: [{ token: Logger, useValue: 'fake value' }],
  })
  class Module5 {}

  const module2WithParams: ModuleWithParams = Module2.withParams();
  const module3WithParams: ModuleWithParams = { path: 'one', module: Module3 };
  const module4WithParams: ModuleWithParams = { module: Module4 };
  @rootModule({
    imports: [Module0, Module1, module2WithParams, Module5, module3WithParams, module4WithParams],
    exports: [Module0, module2WithParams, module3WithParams],
    providersPerApp: [Logger, { token: Router, useValue: 'fake' }],
  })
  class AppModule {}

  let appMetadataMap: Map<ModRefId, MetadataPerMod1>;

  beforeAll(() => {
    const systemLogMediator = new SystemLogMediator({ moduleName: 'fakeName' });
    moduleManager = new ModuleManager(systemLogMediator);
    const appOptions = new AppOptions();
    mock = new AppInitializerMock(appOptions, moduleManager, systemLogMediator);
    moduleManager.scanRootModule(AppModule);
    appMetadataMap = mock.bootstrapModuleFactory(moduleManager);
  });

  function checkGlobalProviders(metadataPerMod1: MetadataPerMod1 | undefined) {
    const tokensPerMod = getImportedTokens(metadataPerMod1?.importedTokensMap.perMod).slice(0, 3);
    expect(tokensPerMod).toEqual([Provider0, Provider3, Provider4]);
    const tokensPerReq = getImportedTokens(metadataPerMod1?.importedTokensMap.perReq).slice(0, 3);
    expect(tokensPerReq).toEqual([Provider5, Provider6, Provider7]);

    // Global providers per a module
    const perMod = metadataPerMod1?.importedTokensMap?.perMod!;
    const expectedPerMod = new ImportObj();

    expectedPerMod.modRefId = Module0;
    expectedPerMod.providers = [Provider0];
    expect(perMod.get(Provider0)).toEqual(expectedPerMod);

    expectedPerMod.modRefId = module2WithParams;
    expectedPerMod.providers = [Provider3];
    expect(perMod.get(Provider3)).toEqual(expectedPerMod);
    expectedPerMod.providers = [Provider4];
    expect(perMod.get(Provider4)).toEqual(expectedPerMod);

    // Global providers per a request
    const perReq = metadataPerMod1?.importedTokensMap.perReq!;
    const expectedPerReq = new ImportObj();
    expectedPerReq.modRefId = module3WithParams;
    expectedPerReq.providers = [Provider5];
    expect(perReq.get(Provider5)).toEqual(expectedPerReq);
    expectedPerReq.providers = [Provider6];
    expect(perReq.get(Provider6)).toEqual(expectedPerReq);
    expectedPerReq.providers = [Provider7];
    expect(perReq.get(Provider7)).toEqual(expectedPerReq);
  }

  it('Module0', async () => {
    const mod0 = appMetadataMap.get(Module0);
    expect(mod0?.meta.providersPerApp).toEqual([]);
    const moduleExtract: ModuleExtract = { path: '', moduleName: 'Module0', isExternal: false };
    const providerPerMod: Provider = { token: ModuleExtract, useValue: moduleExtract };
    expect(mod0?.meta.providersPerMod).toEqual([providerPerMod, Provider0]);
    expect(mod0?.meta.providersPerReq).toEqual([]);
    checkGlobalProviders(mod0);
  });

  it('Module1', async () => {
    const mod1 = appMetadataMap.get(Module1);
    expect(mod1?.meta.providersPerApp).toEqual([]);
    const moduleExtract: ModuleExtract = { path: '', moduleName: 'Module1', isExternal: false };
    const providerPerMod: Provider = { token: ModuleExtract, useValue: moduleExtract };
    expect(mod1?.meta.providersPerMod).toEqual([providerPerMod, obj1, Provider2]);
    checkGlobalProviders(mod1);
  });

  it('Module2', async () => {
    const mod2 = appMetadataMap.get(module2WithParams);
    expect(mod2?.meta.providersPerApp).toEqual([]);
    const moduleExtract: ModuleExtract = { path: '', moduleName: 'Module2', isExternal: false };
    const providerPerMod: Provider = { token: ModuleExtract, useValue: moduleExtract };
    expect(mod2?.meta.providersPerMod).toEqual([providerPerMod, Provider3, Provider4]);
    expect(mod2?.meta.providersPerReq).toEqual([]);
    checkGlobalProviders(mod2);
  });

  it('Module3', async () => {
    const mod3 = appMetadataMap.get(module3WithParams);
    expect(mod3?.meta.providersPerApp).toEqual([]);
    const moduleExtract: ModuleExtract = { path: 'one', moduleName: 'Module3', isExternal: false };
    const providerPerMod: Provider = {
      token: ModuleExtract,
      useValue: moduleExtract,
    };
    expect(mod3?.meta.providersPerMod).toEqual([providerPerMod]);
    expect(mod3?.meta.providersPerReq).toEqual([Provider5, Provider6, Provider7]);
    checkGlobalProviders(mod3);
  });

  it('Module4', async () => {
    moduleManager.scanRootModule(AppModule);
    const appMetadataMap = mock.bootstrapModuleFactory(moduleManager);
    const mod4 = appMetadataMap.get(module4WithParams);
    expect(mod4?.meta.providersPerApp).toEqual([]);
    const moduleExtract: ModuleExtract = { path: '', moduleName: 'Module4', isExternal: false };
    const providerPerMod: Provider = { token: ModuleExtract, useValue: moduleExtract };
    expect(mod4?.meta.providersPerMod).toEqual([providerPerMod]);
    expect(mod4?.meta.providersPerReq).toEqual([Provider8, Provider9]);
    checkGlobalProviders(mod4);
  });

  it('AppModule', async () => {
    moduleManager.scanRootModule(AppModule);
    const appMetadataMap = mock.bootstrapModuleFactory(moduleManager);
    const root1 = appMetadataMap.get(AppModule);
    expect(root1?.meta.providersPerApp.slice(0, 2)).toEqual([Logger, { token: Router, useValue: 'fake' }]);
    const moduleExtract: ModuleExtract = { path: '', moduleName: 'AppModule', isExternal: false };
    const providerPerMod: Provider = {
      token: ModuleExtract,
      useValue: moduleExtract,
    };
    expect(root1?.meta.providersPerMod).toEqual([providerPerMod]);
    expect(root1?.meta.providersPerReq).toEqual([]);
    checkGlobalProviders(root1);
    expect(getImportedTokens(root1?.importedTokensMap.perMod)).toEqual([Provider0, Provider3, Provider4, Provider1]);
    expect(getImportedTokens(root1?.importedTokensMap.perReq)).toEqual([
      Provider5,
      Provider6,
      Provider7,
      Provider8,
      Provider9,
    ]);
  });
});
it('should works without providersPerApp', () => {
  @controller()
  class Controller1 {}

  @featureModule({ controllers: [Controller1] })
  class Module7 {}

  const meta = moduleManager.scanModule(Module7);
  const providersPerApp = mock.collectProvidersPerApp(meta);
  expect(providersPerApp).toEqual([]);
});
