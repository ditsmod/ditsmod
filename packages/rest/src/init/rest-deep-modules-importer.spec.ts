import {
  clearDebugClassNames,
  featureModule,
  forwardRef,
  inject,
  injectable,
  Injector,
  KeyRegistry,
  ModuleManager,
  ModuleType,
  Provider,
  rootModule,
  SystemLogMediator,
  BaseAppInitializer,
  BaseAppOptions,
  BaseMeta,
  DeepModulesImporter,
  ModRefId,
  MetadataPerMod2,
  ModuleWithParams,
} from '@ditsmod/core';
import { coreErrors } from '@ditsmod/core/errors';

import { CanActivate, guard } from '#interceptors/guard.js';
import { defaultProvidersPerReq } from '#providers/default-providers-per-req.js';
import { defaultProvidersPerRou } from '#providers/default-providers-per-rou.js';
import { RequestContext } from '#services/request-context.js';
import { initRest } from '#decorators/rest-init-hooks-and-metadata.js';
import { RestMetadataPerMod2 } from './types.js';
import { RestModuleParams } from './rest-init-raw-meta.js';

describe('DeepModulesImporter', () => {
  class AppInitializerMock extends BaseAppInitializer {
    override baseMeta = new BaseMeta();

    override collectProvidersShallow(moduleManager: ModuleManager) {
      return super.collectProvidersShallow(moduleManager);
    }
  }

  function getMetadataPerMod2(rootModule: ModuleType) {
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
      providersPerApp: initializer.baseMeta.providersPerApp,
      log: systemLogMediator,
    });
    const { extensionCounters, mMetadataPerMod2 } = deepModulesImporter.importModulesDeep();
    return mMetadataPerMod2 as Map<ModRefId, MetadataPerMod2<RestMetadataPerMod2>>;
  }

  function getRestMetadataPerMod2(rootModule: ModuleType) {
    return getMetadataPerMod2(rootModule).get(rootModule)?.deepImportedModules.get(initRest);
  }

  beforeEach(() => {
    clearDebugClassNames();
  });

  it('synchronization between baseMeta and initMeta remains', () => {
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

    const map = getMetadataPerMod2(AppModule);
    const rootBaseMeta = map.get(AppModule)?.baseMeta;
    const mod1BaseMeta = map.get(Module1)?.baseMeta;

    expect(mod1BaseMeta?.providersPerApp).toEqual([Service1, Service3]);
    expect(mod1BaseMeta?.providersPerMod.includes(Service2)).toBeTruthy();
    expect(mod1BaseMeta?.providersPerMod.includes(Service4)).toBeTruthy();
    expect(rootBaseMeta?.providersPerApp.includes(Service5)).toBeTruthy();
    expect(rootBaseMeta?.providersPerMod.includes(Service6)).toBeTruthy();

    const mod1InitMeta = mod1BaseMeta?.initMeta.get(initRest);
    expect(mod1BaseMeta?.providersPerApp).toEqual(mod1InitMeta?.providersPerApp);    
    expect(mod1BaseMeta?.providersPerMod).toEqual(mod1InitMeta?.providersPerMod);
    expect(mod1InitMeta?.providersPerApp).toEqual([Service1, Service3]);
    expect(mod1InitMeta?.providersPerMod.includes(Service2)).toBeTruthy();
    expect(mod1InitMeta?.providersPerMod.includes(Service4)).toBeTruthy();

    const rootInitMeta = rootBaseMeta?.initMeta.get(initRest);
    expect(rootBaseMeta?.providersPerApp).toEqual(rootInitMeta?.providersPerApp);
    expect(rootBaseMeta?.providersPerMod).toEqual(rootInitMeta?.providersPerMod);
    expect(rootInitMeta?.providersPerApp).toEqual([Service5]);
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

    const map = getMetadataPerMod2(AppModule);
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

    const restMetadataPerMod2 = getRestMetadataPerMod2(AppModule);
    expect(restMetadataPerMod2?.meta.providersPerRou.includes(Provider1)).toBeTruthy();
  });

  it('root module with initRest decorator exports Provider2 and imports Module1 that has not initRest decorator', () => {
    class Provider1 {}
    class Provider2 {}

    @featureModule({ providersPerApp: [Provider1] })
    class Module1 {}

    @initRest({ providersPerReq: [Provider2], exports: [Provider2] })
    @rootModule({ imports: [Module1] })
    class AppModule {}

    const map = getMetadataPerMod2(AppModule);
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

    const map = getMetadataPerMod2(AppModule);
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

    const moduleWithParams: RestModuleParams & ModuleWithParams = {
      path: 'test-prefix',
      guards: [Guard1, [Guard2, { one: 1 }]],
      module: Module1,
    };

    @initRest({ imports: [moduleWithParams] })
    @rootModule()
    class AppModule {}

    const map = getMetadataPerMod2(AppModule);
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

    const map = getMetadataPerMod2(AppModule);
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

    let msg = 'for Module2: no provider for Service1! (required by Service2 -> Service1). ';
    msg += 'Searched in providersPerRou, providersPerMod, providersPerApp';
    expect(() => getMetadataPerMod2(Module3)).toThrow(msg);
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

    @initRest({ providersPerRou: [Service3, Service4], exports: [Service4] })
    @featureModule({
      imports: [Module1],
      providersPerMod: [Service2],
    })
    class Module2 {}

    @rootModule({
      imports: [Module2],
    })
    class AppModule {}

    const initMeta = getRestMetadataPerMod2(AppModule)!.meta!;
    expect(initMeta.providersPerRou).toEqual([...defaultProvidersPerRou, Service3, Service4]);
    expect(initMeta.providersPerReq).toEqual(defaultProvidersPerReq);
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
    expect(() => getMetadataPerMod2(AppModule)).toThrow(msg);
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
    expect(() => getMetadataPerMod2(Module3)).toThrow(msg);
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

    @initRest({ providersPerRou: [Service2], exports: [Service2] })
    @featureModule()
    class Module2 {}

    @rootModule({ imports: [Module1, Module2] })
    class AppModule {}

    let msg = 'for Module2: no provider for Service1! (required by Service2 -> Service1). ';
    msg += 'Searched in providersPerRou, providersPerMod, providersPerApp';
    expect(() => getMetadataPerMod2(AppModule)).toThrow(msg);
  });

  it('Service2 declared per route and it has dependency on Service1 which is declared per module', () => {
    @injectable()
    class Service1 {}

    @injectable()
    class Service2 {
      constructor(public service1: Service1) {}
    }

    @featureModule({ providersPerMod: [Service1], exports: [Service1] })
    class Module1 {}

    @initRest({ imports: [Module1], providersPerRou: [Service2], exports: [Service2] })
    @featureModule()
    class Module2 {}

    @rootModule({ imports: [Module2] })
    class AppModule {}

    const initMeta = getRestMetadataPerMod2(AppModule)!.meta!;
    expect(initMeta.providersPerReq).toEqual(defaultProvidersPerReq);
    expect(initMeta.providersPerRou.slice(-1)).toEqual([Service2]);
    expect(initMeta.providersPerMod.includes(Service1)).toBeTruthy();
  });

  it('Service2 is not exported from the host module, but is imported into the AppModule because Service3 depends on it', () => {
    class Service1 {}
    class Service2 {}

    @injectable()
    class Service3 {
      constructor(service1: Service1, service2: Service2) {}
    }

    @featureModule({ providersPerMod: [Service1], exports: [Service1] })
    class Module1 {}

    @initRest({ imports: [Module1], providersPerRou: [Service3, Service2], exports: [Service3] })
    @featureModule()
    class Module2 {}

    @rootModule({
      imports: [Module1, Module2],
    })
    class AppModule {}

    const initMeta = getRestMetadataPerMod2(AppModule)!.meta!;
    expect(initMeta.providersPerReq).toEqual(defaultProvidersPerReq);
    expect(initMeta.providersPerRou.slice(-2)).toEqual([Service2, Service3]);
    expect(initMeta.providersPerMod.includes(Service1)).toBeTruthy();
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

    @initRest({ providersPerRou: [Service1], exports: [Service1] })
    @featureModule()
    class Module1 {}

    @initRest({ providersPerRou: [Service2], exports: [Service2] })
    @featureModule({ imports: [Module1] })
    class Module2 {}

    @initRest({ providersPerRou: [Service3], exports: [Service3] })
    @rootModule({
      imports: [Module2],
    })
    class AppModule {}

    const initMeta = getRestMetadataPerMod2(AppModule)!.meta!;
    const injector = Injector.resolveAndCreate(initMeta.providersPerRou);
    const msg = 'No provider for Service1!; this error during instantiation of Service2! (Service3 -> Service2)';
    const cause = coreErrors.noProvider([Service1]);
    const err = coreErrors.instantiationError(cause, [Service2, Service3]);
    expect(() => injector.get(Service3)).toThrow(err);
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

    const initMeta = getRestMetadataPerMod2(AppModule)!.meta!;
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

    const mod1WithParams: ModuleWithParams & RestModuleParams = { module: Module1, guards: [BearerGuard1] };
    const provider: Provider = { token: BearerGuard1, useClass: BearerGuard2 };

    @initRest({ imports: [mod1WithParams], providersPerRou: [provider, Service0, Service2] })
    @rootModule()
    class AppModule {}

    const mMetadataPerMod2 = getMetadataPerMod2(AppModule);
    const mod1 = mMetadataPerMod2.get(mod1WithParams);
    const restMetadataPerMod2 = mod1?.deepImportedModules.get(initRest) as RestMetadataPerMod2;
    expect(restMetadataPerMod2.guards1.at(0)?.guard).toBe(BearerGuard1);

    // Guards per a module must have ref to host module baseMeta.
    expect(restMetadataPerMod2.guards1.at(0)?.baseMeta.modRefId === AppModule).toBe(true);

    // The injector must have enough providers to create a guard instance.
    const injector = Injector.resolveAndCreate(restMetadataPerMod2.guards1.at(0)?.meta.providersPerRou || []);
    expect(() => injector.get(BearerGuard1)).not.toThrow();
    expect(injector.get(BearerGuard1)).toBeInstanceOf(BearerGuard2);

    // Corresponding values are created for the entire chain of dependencies.
    const { id } = KeyRegistry.get(Service0);
    expect(injector.getValue(id)).toBeInstanceOf(Service0);
  });
});
