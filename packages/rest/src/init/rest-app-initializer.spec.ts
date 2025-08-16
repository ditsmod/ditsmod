import { AppOptions } from '#types/app-options.js';
import { controller } from '#types/controller.js';
import {
  featureModule,
  injectable,
  Logger,
  ModuleExtract,
  ModuleManager,
  ModuleWithParams,
  Provider,
  rootModule,
  SystemLogMediator,
  ProviderImport,
  ModuleWithInitParams,
  ModRefId,
  NewShallowImports,
} from '@ditsmod/core';
import { RestAppInitializer } from './rest-app-initializer.js';
import { Router } from '../services/router.js';
import { initRest } from '#decorators/rest-init-hooks-and-metadata.js';

function getImportedTokens(map: Map<any, ProviderImport<Provider>> | undefined) {
  return [...(map || [])].map(([key]) => key);

  @injectable()
  class AppInitializerMock extends RestAppInitializer {
    override collectProvidersShallow(moduleManager: ModuleManager) {
      return super.collectProvidersShallow(moduleManager);
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
    @initRest({ controllers: [Ctrl] })
    @featureModule({
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

    @initRest({ providersPerReq: [Provider5, Provider6, Provider7], exports: [Provider5, Provider6, Provider7] })
    @featureModule({})
    class Module3 {}

    @initRest({ providersPerReq: [Provider8, Provider9], exports: [Provider8, Provider9] })
    @featureModule()
    class Module4 {}

    @featureModule({
      providersPerApp: [{ token: Logger, useValue: 'fake value' }],
    })
    class Module5 {}

    const module2WithParams: ModuleWithParams = Module2.withParams();
    const module3WithParams: ModuleWithInitParams = { module: Module3, initParams: new Map() };
    module3WithParams.initParams.set(initRest, { path: 'one' });
    const module4WithParams: ModuleWithParams = { module: Module4 };
    @rootModule({
      imports: [Module0, Module1, module2WithParams, Module5, module3WithParams, module4WithParams],
      exports: [Module0, module2WithParams, module3WithParams],
      providersPerApp: [Logger, { token: Router, useValue: 'fake' }],
    })
    class AppModule {}

    let shallowImportsBase: Map<ModRefId, NewShallowImports>;

    beforeAll(() => {
      const systemLogMediator = new SystemLogMediator({ moduleName: 'fakeName' });
      moduleManager = new ModuleManager(systemLogMediator);
      const appOptions = new AppOptions();
      mock = new AppInitializerMock(appOptions, moduleManager, systemLogMediator);
      moduleManager.scanRootModule(AppModule);
      shallowImportsBase = mock.collectProvidersShallow(moduleManager);
    });

    function checkGlobalProviders(metadataPerMod1: NewShallowImports | undefined) {
      const tokensPerMod = getImportedTokens(metadataPerMod1?.baseImportRegistry.perMod).slice(0, 3);
      expect(tokensPerMod).toEqual([Provider0, Provider3, Provider4]);
      const tokensPerReq = getImportedTokens(metadataPerMod1?.baseImportRegistry.perReq).slice(0, 3);
      expect(tokensPerReq).toEqual([Provider5, Provider6, Provider7]);

      // Global providers per a module
      const perMod = metadataPerMod1?.baseImportRegistry?.perMod!;
      const expectedPerMod = new ProviderImport();

      expectedPerMod.modRefId = Module0;
      expectedPerMod.providers = [Provider0];
      expect(perMod.get(Provider0)).toEqual(expectedPerMod);

      expectedPerMod.modRefId = module2WithParams;
      expectedPerMod.providers = [Provider3];
      expect(perMod.get(Provider3)).toEqual(expectedPerMod);
      expectedPerMod.providers = [Provider4];
      expect(perMod.get(Provider4)).toEqual(expectedPerMod);

      // Global providers per a request
      const perReq = metadataPerMod1?.baseImportRegistry.perReq!;
      const expectedPerReq = new ProviderImport();
      expectedPerReq.modRefId = module3WithParams;
      expectedPerReq.providers = [Provider5];
      expect(perReq.get(Provider5)).toEqual(expectedPerReq);
      expectedPerReq.providers = [Provider6];
      expect(perReq.get(Provider6)).toEqual(expectedPerReq);
      expectedPerReq.providers = [Provider7];
      expect(perReq.get(Provider7)).toEqual(expectedPerReq);
    }

    it('Module0', async () => {
      const mod0 = shallowImportsBase.get(Module0);
      expect(mod0?.baseMeta.providersPerApp).toEqual([]);
      const moduleExtract: ModuleExtract = { path: '', moduleName: 'Module0', isExternal: false };
      const providerPerMod: Provider = { token: ModuleExtract, useValue: moduleExtract };
      expect(mod0?.baseMeta.providersPerMod).toEqual([providerPerMod, Provider0]);
      expect(mod0?.baseMeta.providersPerReq).toEqual([]);
      checkGlobalProviders(mod0);
    });

    it('Module1', async () => {
      const mod1 = shallowImportsBase.get(Module1);
      expect(mod1?.baseMeta.providersPerApp).toEqual([]);
      const moduleExtract: ModuleExtract = { path: '', moduleName: 'Module1', isExternal: false };
      const providerPerMod: Provider = { token: ModuleExtract, useValue: moduleExtract };
      expect(mod1?.baseMeta.providersPerMod).toEqual([providerPerMod, obj1, Provider2]);
      checkGlobalProviders(mod1);
    });

    it('Module2', async () => {
      const mod2 = shallowImportsBase.get(module2WithParams);
      expect(mod2?.baseMeta.providersPerApp).toEqual([]);
      const moduleExtract: ModuleExtract = { path: '', moduleName: 'Module2', isExternal: false };
      const providerPerMod: Provider = { token: ModuleExtract, useValue: moduleExtract };
      expect(mod2?.baseMeta.providersPerMod).toEqual([providerPerMod, Provider3, Provider4]);
      expect(mod2?.baseMeta.providersPerReq).toEqual([]);
      checkGlobalProviders(mod2);
    });

    it('Module3', async () => {
      const mod3 = shallowImportsBase.get(module3WithParams);
      expect(mod3?.baseMeta.providersPerApp).toEqual([]);
      const moduleExtract: ModuleExtract = { path: 'one', moduleName: 'Module3', isExternal: false };
      const providerPerMod: Provider = {
        token: ModuleExtract,
        useValue: moduleExtract,
      };
      expect(mod3?.baseMeta.providersPerMod).toEqual([providerPerMod]);
      expect(mod3?.baseMeta.providersPerReq).toEqual([Provider5, Provider6, Provider7]);
      checkGlobalProviders(mod3);
    });

    it('Module4', async () => {
      moduleManager.scanRootModule(AppModule);
      const shallowImportsBase = mock.collectProvidersShallow(moduleManager);
      const mod4 = shallowImportsBase.get(module4WithParams);
      expect(mod4?.baseMeta.providersPerApp).toEqual([]);
      const moduleExtract: ModuleExtract = { path: '', moduleName: 'Module4', isExternal: false };
      const providerPerMod: Provider = { token: ModuleExtract, useValue: moduleExtract };
      expect(mod4?.baseMeta.providersPerMod).toEqual([providerPerMod]);
      expect(mod4?.baseMeta.providersPerReq).toEqual([Provider8, Provider9]);
      checkGlobalProviders(mod4);
    });

    it('AppModule', async () => {
      moduleManager.scanRootModule(AppModule);
      const shallowImportsBase = mock.collectProvidersShallow(moduleManager);
      const root1 = shallowImportsBase.get(AppModule);
      expect(root1?.baseMeta.providersPerApp.slice(0, 2)).toEqual([Logger, { token: Router, useValue: 'fake' }]);
      const moduleExtract: ModuleExtract = { path: '', moduleName: 'AppModule', isExternal: false };
      const providerPerMod: Provider = {
        token: ModuleExtract,
        useValue: moduleExtract,
      };
      expect(root1?.baseMeta.providersPerMod).toEqual([providerPerMod]);
      expect(root1?.baseMeta.providersPerReq).toEqual([]);
      checkGlobalProviders(root1);
      expect(getImportedTokens(root1?.baseImportRegistry.perMod)).toEqual([Provider0, Provider3, Provider4, Provider1]);
      expect(getImportedTokens(root1?.baseImportRegistry.perReq)).toEqual([
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

    @initRest({ controllers: [Controller1] })
    @featureModule()
    class Module7 {}

    const meta = moduleManager.scanModule(Module7);
    const providersPerApp = mock.collectProvidersPerApp(meta);
    expect(providersPerApp).toEqual([]);
  });
}
