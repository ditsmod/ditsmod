import { injectable, Injector } from '#di';

import { AnyModule, ImportsResolver } from './imports-resolver.js';
import { NormalizedModuleMetadata } from './types/normalized-module-metadata.js';
import { GlobalProviders, ImportedTokensMap } from './types/metadata-per-mod.js';
import { GuardPerMod1, ModuleType, Provider, Scope } from './types/mix.js';
import { ModuleWithParams } from './types/module-metadata.js';
import { ModuleFactory } from './module-factory.js';
import { ModuleManager } from '#services/module-manager.js';
import { SystemLogMediator } from './logger/system-log-mediator.js';
import { featureModule } from '#decorators/module.js';
import { SystemErrorMediator } from './error/system-error-mediator.js';
import { defaultProvidersPerReq } from './default-providers-per-req.js';
import { defaultProvidersPerRou } from './default-providers-per-rou.js';
import { ModuleExtract } from '#types/module-extract.js';
import { rootModule } from '#decorators/root-module.js';

describe('ImportsResolver', () => {
  @injectable()
  class ImportsResolverMock extends ImportsResolver {
    declare unfinishedSearchDependecies: [ModuleType | ModuleWithParams, Provider][];
    override resolveImportedProviders(
      targetMeta: NormalizedModuleMetadata,
      importedTokensMap: ImportedTokensMap,
      guardsPerMod: GuardPerMod1[],
    ) {
      return super.resolveImportedProviders(targetMeta, importedTokensMap, guardsPerMod);
    }
    override addToUnfinishedSearchDependecies(module: ModuleType | ModuleWithParams, provider: Provider) {
      return super.addToUnfinishedSearchDependecies(module, provider);
    }
    override deleteFromUnfinishedSearchDependecies(module: ModuleType | ModuleWithParams, provider: Provider) {
      return super.deleteFromUnfinishedSearchDependecies(module, provider);
    }

    override grabDependecies(
      targetMeta: NormalizedModuleMetadata,
      sourceModule: AnyModule,
      importedProvider: Provider,
      scopes: Scope[],
      path: any[] = [],
    ) {
      return super.grabDependecies(targetMeta, sourceModule, importedProvider, scopes, path);
    }
  }

  let mock: ImportsResolverMock;
  let moduleFactory: ModuleFactory;
  let moduleManager: ModuleManager;
  let systemLogMediator: SystemLogMediator;
  let errorMediator: SystemErrorMediator;

  beforeEach(() => {
    mock = new ImportsResolverMock(null as any, null as any, null as any, null as any, null as any);

    const injectorPerApp = Injector.resolveAndCreate([ModuleFactory]);
    moduleFactory = injectorPerApp.get(ModuleFactory);
    systemLogMediator = new SystemLogMediator({ moduleName: 'fakeName' });
    errorMediator = new SystemErrorMediator({ moduleName: 'fakeName' });
    moduleManager = new ModuleManager(systemLogMediator);
  });

  describe('resolve()', () => {
    function bootstrap(mod: ModuleType) {
      expect(() => moduleManager.scanModule(mod)).not.toThrow();
      const appMetadataMap = moduleFactory.bootstrap([], new GlobalProviders(), '', mod, moduleManager, new Set());
      mock = new ImportsResolverMock(moduleManager, appMetadataMap, [], systemLogMediator, errorMediator);
      return appMetadataMap;
    }

    it('No import and no error is thrown even though Service2 from Module2 depends on Service1 and Module2 does not import any modules', () => {
      @injectable()
      class Service1 {}

      @injectable()
      class Service2 {
        constructor(public service1: Service1) {}
      }

      @featureModule({ providersPerRou: [Service2], exports: [Service2] })
      class Module2 {}

      bootstrap(Module2);
      expect(() => mock.resolve()).not.toThrow();
    });

    it(`Module3 imports Module2, which has a dependency on Service1, but Module2 does not import any modules with Service1;
      in this case an error should be thrown`, () => {
      @injectable()
      class Service1 {}

      @injectable()
      class Service2 {
        constructor(public service1: Service1) {}
      }

      @featureModule({ providersPerRou: [Service2], exports: [Service2] })
      class Module2 {}

      @rootModule({ imports: [Module2] })
      class Module3 {}

      bootstrap(Module3);
      let msg = 'Resolving imported dependecies for Module2 failed: no provider for Service1! (Service2 -> Service1';
      msg += ', searching in providersPerRou, providersPerMod)';
      expect(() => mock.resolve()).toThrow(msg);
    });

    it(`Module3 imports Module2, which has a dependency on Module1, but Module2 does not import Module1;
      although Module3 imports Module1, but an error should be thrown`, () => {
      @injectable()
      class Service1 {}

      @injectable()
      class Service2 {
        constructor(public service1: Service1) {}
      }

      @featureModule({ providersPerMod: [Service1], exports: [Service1] })
      class Module1 {}

      @featureModule({ providersPerRou: [Service2], exports: [Service2] })
      class Module2 {}

      @rootModule({ imports: [Module1, Module2] })
      class Module3 {}

      bootstrap(Module3);
      let msg = 'Resolving imported dependecies for Module2 failed: no provider for Service1! (Service2 -> Service1';
      msg += ', searching in providersPerRou, providersPerMod)';
      expect(() => mock.resolve()).toThrow(msg);
    });

    it('Module3 imports Module2, which has a dependency on Module1, and Module2 import Module1', () => {
      @injectable()
      class Service1 {}

      @injectable()
      class Service2 {
        constructor(public service1: Service1) {}
      }

      @featureModule({ providersPerMod: [Service1], exports: [Service1] })
      class Module1 {}

      @featureModule({ imports: [Module1], providersPerRou: [Service2], exports: [Service2] })
      class Module2 {}

      @rootModule({
        imports: [Module2],
      })
      class Module3 {}

      const appMetadataMap = bootstrap(Module3);
      expect(() => mock.resolve()).not.toThrow();
      const { meta } = appMetadataMap.get(Module3)!;
      expect(meta.providersPerReq).toEqual(defaultProvidersPerReq);
      expect(meta.providersPerRou).toEqual([...defaultProvidersPerRou, Service2]);
      const moduleExtract: ModuleExtract = {
        path: '',
        moduleName: 'Module3',
        isExternal: false,
      };
      expect(meta.providersPerMod).toEqual([Service1, { token: ModuleExtract, useValue: moduleExtract }]);
    });

    it(`Module3 has a duplicate of Service1 in the imported providers because it imports Module1
      where Service1 is and also imports Module2 which also depends on Service1`, () => {
      @injectable()
      class Service1 {}

      @injectable()
      class Service2 {
        constructor(public service1: Service1) {}
      }

      @featureModule({ providersPerMod: [Service1], exports: [Service1] })
      class Module1 {}

      @featureModule({ imports: [Module1], providersPerRou: [Service2], exports: [Service2] })
      class Module2 {}

      @rootModule({
        imports: [Module1, Module2],
      })
      class Module3 {}

      const appMetadataMap = bootstrap(Module3);
      expect(() => mock.resolve()).not.toThrow();
      const { meta } = appMetadataMap.get(Module3)!;
      expect(meta.providersPerReq).toEqual(defaultProvidersPerReq);
      expect(meta.providersPerRou).toEqual([...defaultProvidersPerRou, Service2]);
      const moduleExtract: ModuleExtract = {
        path: '',
        moduleName: 'Module3',
        isExternal: false,
      };
      expect(meta.providersPerMod).toEqual([Service1, Service1, { token: ModuleExtract, useValue: moduleExtract }]);
    });

    it('Module3 does not load the Service1 as dependency because Service2 does not declare this dependency', () => {
      @injectable()
      class Service1 {}

      @injectable()
      class Service2 {
        constructor(public injector: Injector) {
          const service1 = this.injector.get(Service1); // Lazy loading here.
        }
      }

      @injectable()
      class Service3 {
        constructor(public service2: Service2) {}
      }

      @featureModule({ providersPerRou: [Service1], exports: [Service1] })
      class Module1 {}

      @featureModule({ imports: [Module1], providersPerRou: [Service2], exports: [Service2] })
      class Module2 {}

      @featureModule({
        imports: [Module2],
        providersPerRou: [Service3],
        exports: [Service3],
      })
      class Module3 {}

      const appMetadataMap = bootstrap(Module3);

      expect(() => mock.resolve()).not.toThrow();
      const { meta } = appMetadataMap.get(Module3)!;
      const injector = Injector.resolveAndCreate(meta.providersPerRou);
      const msg = 'No provider for Service1!; this error during instantiation of Service2! (Service3 -> Service2)';
      expect(() => injector.get(Service3)).toThrow(msg);
    });

    it(`By directly importing Module1, Module2 adds all providers from that module,
      regardless of whether those providers resolve the declared dependency or not`, () => {
      @injectable()
      class Service1 {}

      @injectable()
      class Service2 {
        constructor(public injector: Injector) {
          const service1 = this.injector.get(Service1); // Lazy loading here.
        }
      }

      @featureModule({ providersPerRou: [Service1], exports: [Service1] })
      class Module1 {}

      @featureModule({ imports: [Module1], providersPerRou: [Service2], exports: [Service2] })
      class Module2 {}

      const appMetadataMap = bootstrap(Module2);

      expect(() => mock.resolve()).not.toThrow();
      const { meta } = appMetadataMap.get(Module2)!;
      const injector = Injector.resolveAndCreate(meta.providersPerRou);
      expect(() => injector.get(Service2)).not.toThrow();
    });
  });

  describe('resolveImportedProviders', () => {
    describe('addToUnfinishedSearchDependecies(), deleteFromUnfinishedSearchDependecies() and throwCircularDependencies()', () => {
      class Module1 {}
      class Provider1 {}
      class Module2 {}
      class Provider2 {}
      class Module3 {}
      class Provider3 {}

      it('adding and removing dependecies', () => {
        expect(mock.unfinishedSearchDependecies).toEqual([]);
        mock.addToUnfinishedSearchDependecies(Module1, Provider1);
        mock.addToUnfinishedSearchDependecies(Module2, Provider2);
        mock.addToUnfinishedSearchDependecies(Module3, Provider3);
        expect(mock.unfinishedSearchDependecies).toEqual([
          [Module1, Provider1],
          [Module2, Provider2],
          [Module3, Provider3],
        ]);
        mock.deleteFromUnfinishedSearchDependecies(Module2, Provider2);
        expect(mock.unfinishedSearchDependecies).toEqual([
          [Module1, Provider1],
          [Module3, Provider3],
        ]);
      });

      it('throw properly message', () => {
        expect(mock.unfinishedSearchDependecies).toEqual([]);
        mock.addToUnfinishedSearchDependecies(Module1, Provider1);
        mock.addToUnfinishedSearchDependecies(Module2, Provider2);
        mock.addToUnfinishedSearchDependecies(Module3, Provider3);
        const msg =
          'Detected circular dependencies: [Provider2 in Module2] -> [Provider3 in Module3] -> [Provider2 in Module2]. It is started from [Provider1 in Module1].';
        expect(() => mock.addToUnfinishedSearchDependecies(Module2, Provider2)).toThrow(msg);
      });
    });
  });
});
