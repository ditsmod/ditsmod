import {
  clearDebugClassNames,
  featureModule,
  forwardRef,
  inject,
  injectable,
  Injector,
  ModuleManager,
  ModuleType,
  Provider,
  rootModule,
  SystemLogMediator,
  BaseAppInitializer,
  BaseAppOptions,
  NormalizedModuleMeta,
  DeepModulesImporter,
  ModRefId,
  ResolvedModuleMetadata,
  DynamicModule,
  Context,
} from '@ditsmod/core';
import { InstantiationError, NoProvider } from '@ditsmod/core/errors';

import { CanActivate, guard } from '#interceptors/guard.js';
import { RequestContext } from '#services/request-context.js';
import { initRest, restModule, restRootModule } from '#decorators/rest-init-hooks-and-metadata.js';
import { RestResolvedModuleMetadata } from './types.js';
import { RestModuleOptions } from './rest-init-raw-meta.js';

describe('DeepModulesImporter', () => {
  class AppInitializerMock extends BaseAppInitializer {
    override normalizedModuleMeta = new NormalizedModuleMeta();

    override collectProvidersShallow(moduleManager: ModuleManager) {
      return super.collectProvidersShallow(moduleManager);
    }
  }

  function getResolvedModuleMetadata(rootModule: ModuleType) {
    const systemLogMediator = new SystemLogMediator({ moduleName: 'fakeName' });
    const moduleManager = new ModuleManager(systemLogMediator);
    moduleManager.scanRootModule(rootModule);
    const baseAppOptions = new BaseAppOptions();
    const initializer = new AppInitializerMock(baseAppOptions, moduleManager, systemLogMediator);
    initializer.bootstrapProvidersPerApp();
    systemLogMediator.flush();
    const shallowImportsMap = initializer.collectProvidersShallow(moduleManager);
    const deepModulesImporter = new DeepModulesImporter({
      moduleManager,
      shallowImportsMap,
      providersPerApp: initializer.normalizedModuleMeta.providersPerApp,
      log: systemLogMediator,
    });
    const { extensionCounters, mResolvedModuleMetadata } = deepModulesImporter.importModulesDeep();
    return mResolvedModuleMetadata as Map<ModRefId, ResolvedModuleMetadata<RestResolvedModuleMetadata>>;
  }

  function getRestResolvedModuleMetadata(rootModule: ModuleType) {
    return getResolvedModuleMetadata(rootModule).get(rootModule)?.deepImportedModules.get(initRest);
  }

  beforeEach(() => {
    clearDebugClassNames();
  });

  it('synchronization between normalizedModuleMeta and initMeta remains', () => {
    class Service1 {}
    class Service2 {}
    class Service3 {}
    class Service4 {}
    class Service5 {}
    class Service6 {}

    @initRest({
      providersPerApp: [Service3],
      providersPerMod: [Service4],
    })
    @featureModule({
      providersPerApp: [Service1],
      providersPerMod: [Service2],
    })
    class Module1 {}

    @initRest({
      imports: [Module1],
      providersPerApp: [Service5],
      providersPerMod: [Service6],
    })
    @rootModule()
    class AppModule {}

    const map = getResolvedModuleMetadata(AppModule);
    const rootNormalizedModuleMeta = map.get(AppModule)?.normalizedModuleMeta;
    const mod1NormalizedModuleMeta = map.get(Module1)?.normalizedModuleMeta;

    expect(mod1NormalizedModuleMeta?.providersPerApp).toEqual([Service1, Service3]);
    expect(mod1NormalizedModuleMeta?.providersPerMod.includes(Service2)).toBeTruthy();
    expect(mod1NormalizedModuleMeta?.providersPerMod.includes(Service4)).toBeTruthy();
    expect(rootNormalizedModuleMeta?.providersPerApp.includes(Service5)).toBeTruthy();
    expect(rootNormalizedModuleMeta?.providersPerMod.includes(Service6)).toBeTruthy();

    const mod1InitMeta = mod1NormalizedModuleMeta?.initMeta.get(initRest);
    expect(mod1NormalizedModuleMeta?.providersPerApp).toBe(mod1InitMeta?.providersPerApp);
    expect(mod1NormalizedModuleMeta?.providersPerMod).toBe(mod1InitMeta?.providersPerMod);
    expect(mod1InitMeta?.providersPerApp).toEqual([Service1, Service3]);
    expect(mod1InitMeta?.providersPerMod.includes(Service2)).toBeTruthy();
    expect(mod1InitMeta?.providersPerMod.includes(Service4)).toBeTruthy();

    const rootInitMeta = rootNormalizedModuleMeta?.initMeta.get(initRest);
    expect(rootNormalizedModuleMeta?.providersPerApp).toBe(rootInitMeta?.providersPerApp);
    expect(rootNormalizedModuleMeta?.providersPerMod).toBe(rootInitMeta?.providersPerMod);
    expect(rootInitMeta?.providersPerApp.includes(Service5)).toBeTruthy();
    expect(rootInitMeta?.providersPerMod.includes(Service6)).toBeTruthy();
  });

  it('reexport module that has initRest decorator', () => {
    class Service1 {}

    @initRest({ providersPerReq: [Service1], exports: [Service1] })
    @featureModule()
    class Module1 {}

    @featureModule({ imports: [Module1], exports: [Module1] })
    class Module2 {}

    @rootModule({ imports: [Module2] })
    class AppModule {}

    const map = getResolvedModuleMetadata(AppModule);
    const rootMod = map.get(AppModule)?.deepImportedModules.get(initRest)!;
    const mod2 = map.get(Module2)?.deepImportedModules.get(initRest)!;
    expect(rootMod?.meta.providersPerReq.includes(Service1)).toBeTruthy();
    expect(mod2?.meta.providersPerReq.includes(Service1)).toBeTruthy();
  });

  it('root module without initRest decorator imports Module1 that has initRest decorator', () => {
    class Provider1 {}

    @initRest({
      providersPerRou: [Provider1],
      exports: [Provider1],
    })
    @featureModule()
    class Module1 {}

    @rootModule({ imports: [Module1] })
    class AppModule {}

    const restResolvedModuleMetadata = getRestResolvedModuleMetadata(AppModule);
    expect(restResolvedModuleMetadata?.meta.providersPerRou.includes(Provider1)).toBeTruthy();
  });

  it('root module with initRest decorator exports Provider2 and imports Module1 that has not initRest decorator', () => {
    class Provider1 {}
    class Provider2 {}

    @featureModule({ providersPerApp: [Provider1] })
    class Module1 {}

    @initRest({ providersPerReq: [Provider2], exports: [Provider2] })
    @rootModule({ imports: [Module1] })
    class AppModule {}

    const map = getResolvedModuleMetadata(AppModule);
    const mod1 = map.get(Module1)?.deepImportedModules.get(initRest)!;
    expect(mod1).toBeDefined();
    expect(mod1.meta.providersPerReq.includes(Provider2)).toBeTruthy();
  });

  it('root module without initRest decorator exports Module2 that has initRest and imports Module1 also that has not initRest', () => {
    class Provider1 {}
    class Provider2 {}

    @featureModule({ providersPerApp: [Provider1] })
    class Module1 {}

    @initRest({ providersPerReq: [Provider2], exports: [Provider2] })
    @featureModule({ providersPerApp: [Provider1] })
    class Module2 {}

    @rootModule({ imports: [Module1, Module2], exports: [Module2] })
    class AppModule {}

    const map = getResolvedModuleMetadata(AppModule);
    const mod1 = map.get(Module1)?.deepImportedModules.get(initRest)!;
    expect(mod1).toBeDefined();
    expect(mod1.meta.providersPerReq.includes(Provider2)).toBeTruthy();
  });

  it('root module with initRest decorator imports Module1 that has params, but has not initRest decorator', () => {
    class Provider1 {}
    class Guard1 implements CanActivate {
      async canActivate(ctx: RequestContext, params?: any[]) {
        return false;
      }
    }
    class Guard2 implements CanActivate {
      async canActivate(ctx: RequestContext, params?: any[]) {
        return false;
      }
    }

    @featureModule({ providersPerApp: [Provider1] })
    class Module1 {}

    const moduleWithParams: RestModuleOptions & DynamicModule = {
      path: 'test-prefix',
      guards: [Guard1, [Guard2, { one: 1 }]],
      module: Module1,
    };

    @initRest({ imports: [moduleWithParams] })
    @rootModule()
    class AppModule {}

    const map = getResolvedModuleMetadata(AppModule);
    const rootMod = map.get(AppModule)?.deepImportedModules.get(initRest)!;
    const mod1 = map.get(moduleWithParams)?.deepImportedModules.get(initRest)!;
    expect(mod1.prefixPerMod).toBe('test-prefix');
    expect(mod1.guards1[0].guard).toBe(Guard1);
    expect(mod1.guards1[0].meta).toBe(rootMod.meta);
    expect(mod1.guards1[1].params).toEqual([{ one: 1 }]);
  });

  it('circular imports modules with forwardRef()', () => {
    class Provider1 {}
    class Provider2 {}

    @initRest({
      imports: [forwardRef(() => Module3)],
      providersPerReq: [Provider1],
      exports: [Provider1],
    })
    @featureModule()
    class Module1 {}

    @initRest({ imports: [Module1], exports: [Module1] })
    @featureModule()
    class Module2 {}

    @initRest({
      imports: [Module2],
      providersPerRou: [Provider2],
      exports: [Provider2],
    })
    @featureModule()
    class Module3 {}

    @rootModule({ imports: [Module3] })
    class AppModule {}

    const map = getResolvedModuleMetadata(AppModule);
    const mod1 = map.get(Module1)?.deepImportedModules.get(initRest)!;
    const mod3 = map.get(Module3)?.deepImportedModules.get(initRest)!;
    expect(mod1.meta.providersPerRou.includes(Provider2));
    expect(mod3.meta.providersPerRou.includes(Provider1));
  });

  it(`Module3 imports Module2, which has a dependency on Service1, but Module2 does not import any modules with Service1;
    in this case an error should be thrown`, () => {
    @injectable()
    class Service1 {}

    @injectable()
    class Service2 {
      constructor(public service1: Service1) {}
    }
    @initRest({ providersPerRou: [Service2], exports: [Service2] })
    @featureModule()
    class Module2 {}

    @rootModule({ imports: [Module2] })
    class Module3 {}

    let msg = 'Module2: no provider for Service1! (required by Service2 -> Service1). ';
    msg += 'Searched in providersPerRou, providersPerMod, providersPerApp';
    expect(() => getResolvedModuleMetadata(Module3)).toThrow(msg);
  });

  it(`There is the following dependency chain: Service4 -> Service3 -> Service2 -> Service1;
    AppModule imports Module2, which exports only Service4, but DeepModulesImporter imports
    the entire dependency chain (both from Module2 and from Module1, which is imported
    into Module2)`, () => {
    @injectable()
    class Service1 {}

    @featureModule({ providersPerMod: [Service1], exports: [Service1] })
    class Module1 {}

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

    @restModule({
      providersPerRou: [Service3, Service4],
      exports: [Service4],
      imports: [Module1],
      providersPerMod: [Service2],
    })
    class Module2 {}

    @restRootModule({
      imports: [Module2],
    })
    class AppModule {}

    const initMeta = getRestResolvedModuleMetadata(AppModule)!.meta!;
    const arr = [Service3, Service4, Context];
    expect(arr.every((item) => initMeta.providersPerRou.includes(item))).toBe(true);
    expect([Context].every((item) => initMeta.providersPerReq.includes(item))).toBe(true);
    expect(initMeta.providersPerMod.includes(Service1)).toBeTruthy();
    expect(initMeta.providersPerMod.includes(Service2)).toBeTruthy();
  });

  it('circular dependencies in one module', () => {
    @injectable()
    class Service1 {}

    @featureModule({ providersPerMod: [Service1], exports: [Service1] })
    class Module1 {}

    @injectable()
    class Service2 {
      constructor(@inject(forwardRef(() => Service4)) public service4: any) {}
    }

    @injectable()
    class Service3 {
      constructor(public service2: Service2) {}
    }

    @injectable()
    class Service4 {
      constructor(public service3: Service3) {}
    }

    @initRest({ providersPerRou: [Service2, Service3, Service4], exports: [Service4] })
    @featureModule({
      imports: [Module1],
    })
    class Module2 {}

    @rootModule({
      imports: [Module2],
    })
    class AppModule {}

    let msg = 'Detected circular dependencies: [Service3 in Module2] -> [Service2 in Module2]';
    msg += ' -> [Service4 in Module2] -> [Service3 in Module2]';
    expect(() => getResolvedModuleMetadata(AppModule)).toThrow(msg);
  });

  it('circular dependencies in different modules', () => {
    @injectable()
    class Service1 {
      constructor(@inject(forwardRef(() => Service4)) public service4: any) {}
    }

    @initRest({ providersPerRou: [Service1], exports: [Service1] })
    @featureModule({
      imports: [forwardRef(() => Module2)],
    })
    class Module1 {}

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

    @initRest({ providersPerRou: [Service2, Service3, Service4], exports: [Service4] })
    @featureModule({
      imports: [Module1],
    })
    class Module2 {}

    @rootModule({
      imports: [Module2],
    })
    class Module3 {}

    let msg = 'Detected circular dependencies: [Service3 in Module2] -> [Service2 in Module2]';
    msg += ' -> [Service1 in Module1] -> [Service4 in Module2] -> [Service3 in Module2]';
    expect(() => getResolvedModuleMetadata(Module3)).toThrow(msg);
  });

  it(`AppModule imports Module2, which has a dependency on Module1, but Module2 does not import Module1;
    although AppModule imports Module1, an error should be thrown`, () => {
    @injectable()
    class Service1 {}

    @featureModule({ providersPerMod: [Service1], exports: [Service1] })
    class Module1 {}

    @injectable()
    class Service2 {
      constructor(public service1: Service1) {}
    }

    @restModule({ providersPerRou: [Service2], exports: [Service2] })
    class Module2 {}

    @rootModule({ imports: [Module1, Module2] })
    class AppModule {}

    let msg = 'Module2: no provider for Service1! (required by Service2 -> Service1). ';
    msg += 'Searched in providersPerRou, providersPerMod, providersPerApp';
    expect(() => getResolvedModuleMetadata(AppModule)).toThrow(msg);
  });

  it('Service2 declared per route and it has dependency on Service1 which is declared per module', () => {
    @injectable()
    class Service1 {}

    @injectable()
    class Service2 {
      constructor(public service1: Service1) {}
    }

    @restModule({ providersPerMod: [Service1], exports: [Service1] })
    class Module1 {}

    @restModule({ imports: [Module1], providersPerRou: [Service2], exports: [Service2] })
    class Module2 {}

    @restRootModule({ imports: [Module2] })
    class AppModule {}

    const initMeta = getRestResolvedModuleMetadata(AppModule)!.meta!;
    const arr = [Context];
    expect(arr.every((item) => initMeta.providersPerReq.includes(item))).toBe(true);
    expect(initMeta.providersPerRou.includes(Service2)).toBe(true);
    expect(initMeta.providersPerMod.includes(Service1)).toBeTruthy();
  });

  it('Service2 is not exported from the host module, but is imported into the AppModule because Service3 depends on it', () => {
    class Service1 {}
    class Service2 {}

    @injectable()
    class Service3 {
      constructor(service1: Service1, service2: Service2) {}
    }

    @restModule({ providersPerMod: [Service1], exports: [Service1] })
    class Module1 {}

    @restModule({ imports: [Module1], providersPerRou: [Service3, Service2], exports: [Service3] })
    class Module2 {}

    @restRootModule({
      imports: [Module1, Module2],
    })
    class AppModule {}

    const initMeta = getRestResolvedModuleMetadata(AppModule)!.meta!;
    const arr = [Context];
    expect(arr.every((item) => initMeta.providersPerReq.includes(item))).toBe(true);
    expect(initMeta.providersPerRou.includes(Service2)).toBeTruthy();
    expect(initMeta.providersPerRou.includes(Service3)).toBeTruthy();
    expect(initMeta.providersPerMod.includes(Service1)).toBeTruthy();
  });

  it('deep importer does not load the Service1 to AppModule as dependency because Service2 does not declare this dependency', () => {
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

    @restModule({ providersPerRou: [Service1], exports: [Service1] })
    class Module1 {}

    @restModule({ providersPerRou: [Service2], exports: [Service2], imports: [Module1] })
    class Module2 {}

    @restRootModule({ providersPerRou: [Service3], exports: [Service3], imports: [Module2] })
    class AppModule {}

    const initMeta = getRestResolvedModuleMetadata(AppModule)!.meta!;
    expect(initMeta.providersPerRou.includes(Service2)).toBe(true);
    expect(initMeta.providersPerRou.includes(Service1)).toBe(false);
  });

  it(`By directly importing Module1, AppModule adds all providers from that module,
    regardless of whether those providers resolve the declared dependency or not`, () => {
    @injectable()
    class Service1 {}

    @injectable()
    class Service2 {
      constructor(public injector: Injector) {
        const service1 = this.injector.get(Service1); // Lazy loading here.
      }
    }

    @initRest({ providersPerRou: [Service1], exports: [Service1] })
    @featureModule()
    class Module1 {}

    @initRest({ providersPerRou: [Service2], exports: [Service2] })
    @rootModule({ imports: [Module1] })
    class AppModule {}

    const initMeta = getRestResolvedModuleMetadata(AppModule)!.meta!;
    const injector = Injector.resolveAndCreate(initMeta.providersPerRou);
    expect(() => injector.get(Service2)).not.toThrow();
  });

  it('guards per a module', () => {
    @injectable()
    class Service0 {}

    @injectable()
    class Service1 {}

    @featureModule({ providersPerMod: [Service1], exports: [Service1] })
    class Module1 {}

    @injectable()
    class Service2 {
      constructor(private service0: Service0) {}
    }

    /**
     * This guard is used as token only.
     */
    @guard()
    class BearerGuard1 implements CanActivate {
      async canActivate(ctx: RequestContext, params?: any[]) {
        return false;
      }
    }

    /**
     * This guard is used as substitution of BearerGuard1.
     */
    @guard()
    class BearerGuard2 implements CanActivate {
      constructor(private service2: Service2) {}

      async canActivate(ctx: RequestContext, params?: any[]) {
        return false;
      }
    }

    const mod1WithParams: DynamicModule & RestModuleOptions = { module: Module1, guards: [BearerGuard1] };
    const provider: Provider = { token: BearerGuard1, useClass: BearerGuard2 };

    @restRootModule({ imports: [mod1WithParams], providersPerRou: [provider, Service0, Service2] })
    class AppModule {}

    const mResolvedModuleMetadata = getResolvedModuleMetadata(AppModule);
    const mod1 = mResolvedModuleMetadata.get(mod1WithParams);
    const restResolvedModuleMetadata = mod1?.deepImportedModules.get(initRest) as RestResolvedModuleMetadata;
    expect(restResolvedModuleMetadata.guards1.at(0)?.guard).toBe(BearerGuard1);

    // Guards per a module must have ref to host module normalizedModuleMeta.
    expect(restResolvedModuleMetadata.guards1.at(0)?.normalizedModuleMeta.modRefId).toBe(AppModule);

    // The injector must have enough providers to create a guard instance.
    const injector = Injector.resolveAndCreate(restResolvedModuleMetadata.guards1.at(0)?.meta.providersPerRou || []);
    expect(() => injector.get(BearerGuard1)).not.toThrow();
    expect(injector.get(BearerGuard1)).toBeInstanceOf(BearerGuard2);
  });
});
