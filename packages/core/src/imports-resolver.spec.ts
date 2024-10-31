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
      return moduleFactory.bootstrap([], new GlobalProviders(), '', mod, moduleManager, new Set());
    }

    it('Module2 depends on Module1, but Module2 not imports Module1', () => {
      @injectable()
      class Service1 {}

      @injectable()
      class Service2 {
        constructor(public service1: Service1) {}
      }

      @injectable()
      class Service3 {
        constructor(public service2: Service2) {}
      }

      @injectable()
      class Service4 {
        constructor(public service3: Service3) {}
      }

      @featureModule({ providersPerMod: [Service1], exports: [Service1] })
      class Module1 {}

      @featureModule({ providersPerRou: [Service2], exports: [Service2] })
      class Module2 {}

      @featureModule({ imports: [Module2], providersPerRou: [Service3], exports: [Service3] })
      class Module3 {}

      @featureModule({
        imports: [Module1, Module3],
        providersPerRou: [Service4],
        exports: [Service4],
      })
      class Module4 {}

      const appMetadataMap = bootstrap(Module4);
      mock = new ImportsResolverMock(moduleManager, appMetadataMap, [], systemLogMediator, errorMediator);
      let msg = 'Resolving imported dependecies for Module2 failed: no provider for Service1! (Service2 -> Service1';
      msg += ', searching in providersPerRou, providersPerMod)';
      expect(() => mock.resolve()).toThrow(msg);
    });

    it('Module2 depends on Module1, and Module2 imports Module1', () => {
      @injectable()
      class Service1 {}

      @injectable()
      class Service2 {
        constructor(public service1: Service1) {}
      }

      @injectable()
      class Service3 {
        constructor(public service2: Service2) {}
      }

      @featureModule({ providersPerMod: [Service1], exports: [Service1] })
      class Module1 {}

      @featureModule({ imports: [Module1], providersPerRou: [Service2], exports: [Service2] })
      class Module2 {}

      @featureModule({
        imports: [Module1, Module2],
        providersPerRou: [Service3],
        exports: [Service3],
      })
      class Module3 {}

      const appMetadataMap = bootstrap(Module3);
      mock = new ImportsResolverMock(moduleManager, appMetadataMap, [], systemLogMediator, errorMediator);

      const moduleExtract: ModuleExtract = {
        path: '',
        moduleName: 'Module3',
        isExternal: false,
      };

      expect(() => mock.resolve()).not.toThrow();
      const { meta } = appMetadataMap.get(Module3)!;
      expect(meta.providersPerReq).toEqual(defaultProvidersPerReq);
      expect(meta.providersPerRou).toEqual([...defaultProvidersPerRou, Service2, Service3]);
      expect(meta.providersPerMod).toEqual([Service1, { token: ModuleExtract, useValue: moduleExtract }]);
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
