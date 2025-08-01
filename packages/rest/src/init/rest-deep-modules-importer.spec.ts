import {
  clearDebugClassNames,
  featureModule,
  forwardRef,
  inject,
  injectable,
  Injector,
  KeyRegistry,
  ModuleExtract,
  ModuleManager,
  ModuleType,
  Provider,
  rootModule,
  SystemErrorMediator,
  SystemLogMediator,
  BaseAppInitializer,
  BaseAppOptions,
  ExtensionCounters,
  NormalizedMeta,
  DeepModulesImporter,
  ModuleWithInitParams,
} from '@ditsmod/core';

import { CanActivate, guard } from '#interceptors/guard.js';
import { defaultProvidersPerReq } from '#providers/default-providers-per-req.js';
import { defaultProvidersPerRou } from '#providers/default-providers-per-rou.js';
import { RequestContext } from '#services/request-context.js';
import { initRest } from '#decorators/rest-init-hooks-and-metadata.js';
import { RestMetadataPerMod2 } from './types.js';
import { RestModuleExtract } from '#types/types.js';

describe('DeepModulesImporter', () => {
  class AppInitializerMock extends BaseAppInitializer {
    override baseMeta = new NormalizedMeta();

    constructor(
      public override baseAppOptions: BaseAppOptions,
      public override moduleManager: ModuleManager,
      public override systemLogMediator: SystemLogMediator,
    ) {
      super(baseAppOptions, moduleManager, systemLogMediator);
    }

    async init() {
      this.bootstrapProvidersPerApp();
      await this.bootstrapModulesAndExtensions();
    }

    override prepareProvidersPerApp() {
      return super.prepareProvidersPerApp();
    }

    override collectProvidersShallow(moduleManager: ModuleManager) {
      return super.collectProvidersShallow(moduleManager);
    }

    override getResolvedCollisionsPerApp() {
      return super.getResolvedCollisionsPerApp();
    }

    override decreaseExtensionsCounters(extensionCounters: ExtensionCounters, providers: Provider[]) {
      return super.decreaseExtensionsCounters(extensionCounters, providers);
    }
  }

  function getMetadataPerMod2(mod: ModuleType) {
    const systemLogMediator = new SystemLogMediator({ moduleName: 'fakeName' });
    const errorMediator = new SystemErrorMediator({ moduleName: 'fakeName' });
    const moduleManager = new ModuleManager(systemLogMediator);
    moduleManager.scanRootModule(mod);
    const baseAppOptions = new BaseAppOptions();
    const initializer = new AppInitializerMock(baseAppOptions, moduleManager, systemLogMediator);
    initializer.bootstrapProvidersPerApp();
    systemLogMediator.flush();
    const shallowImports = initializer.collectProvidersShallow(moduleManager);
    const deepModulesImporter = new DeepModulesImporter({
      moduleManager,
      shallowImports,
      providersPerApp: initializer.baseMeta.providersPerApp,
      log: systemLogMediator,
      errorMediator,
    });
    const { extensionCounters, mMetadataPerMod2 } = deepModulesImporter.importModulesDeep();
    return mMetadataPerMod2;
  }

  beforeEach(() => {
    clearDebugClassNames();
  });

  // describe('resolveImportedProviders', () => {
  //   describe('addToUnfinishedSearchDependencies(), deleteFromUnfinishedSearchDependencies() and throwCircularDependencies()', () => {
  //     class Module1 {}
  //     class Provider1 {}
  //     class Module2 {}
  //     class Provider2 {}
  //     class Module3 {}
  //     class Provider3 {}

  //     it('adding and removing dependencies', () => {
  //       expect(mock.unfinishedSearchDependencies).toEqual([]);
  //       mock.addToUnfinishedSearchDependencies(Module1, Provider1);
  //       mock.addToUnfinishedSearchDependencies(Module2, Provider2);
  //       mock.addToUnfinishedSearchDependencies(Module3, Provider3);
  //       expect(mock.unfinishedSearchDependencies).toEqual([
  //         [Module1, Provider1],
  //         [Module2, Provider2],
  //         [Module3, Provider3],
  //       ]);
  //       mock.deleteFromUnfinishedSearchDependencies(Module2, Provider2);
  //       expect(mock.unfinishedSearchDependencies).toEqual([
  //         [Module1, Provider1],
  //         [Module3, Provider3],
  //       ]);
  //     });

  //     it('throw properly message', () => {
  //       expect(mock.unfinishedSearchDependencies).toEqual([]);
  //       mock.addToUnfinishedSearchDependencies(Module1, Provider1);
  //       mock.addToUnfinishedSearchDependencies(Module2, Provider2);
  //       mock.addToUnfinishedSearchDependencies(Module3, Provider3);
  //       const msg =
  //         'Detected circular dependencies: [Provider2 in Module2] -> [Provider3 in Module3] -> [Provider2 in Module2]. It is started from [Provider1 in Module1].';
  //       expect(() => mock.addToUnfinishedSearchDependencies(Module2, Provider2)).toThrow(msg);
  //     });
  //   });
  // });

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

    const mMetadataPerMod2 = getMetadataPerMod2(AppModule);
    const { baseMeta } = mMetadataPerMod2.get(AppModule)!;
    const initMeta = baseMeta.initMeta.get(initRest)!;
    expect(initMeta.providersPerRou).toEqual([...defaultProvidersPerRou, Service3, Service4]);
    expect(initMeta.providersPerReq).toEqual(defaultProvidersPerReq);
    expect(baseMeta.providersPerMod.slice(0, 2)).toEqual([Service1, Service2]);
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

    @initRest({ providersPerRou: [Service3, Service4], exports: [Service4] })
    @featureModule({
      imports: [Module1],
      providersPerMod: [Service2],
    })
    class Module2 {}

    @rootModule({
      imports: [Module2],
    })
    class Module3 {}

    let msg = 'Detected circular dependencies: [Service3 in Module2] -> [Service2 in Module2]';
    msg += ' -> [Service4 in Module2] -> [Service3 in Module2]';
    expect(() => getMetadataPerMod2(Module3)).toThrow(msg);
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

    @initRest({ providersPerRou: [Service2], exports: [Service2] })
    @featureModule({ imports: [Module1] })
    class Module2 {}

    @rootModule({
      imports: [Module2],
    })
    class AppModule {}

    const mMetadataPerMod2 = getMetadataPerMod2(AppModule);
    const { baseMeta } = mMetadataPerMod2.get(AppModule)!;
    const initMeta = baseMeta.initMeta.get(initRest)!;
    expect(initMeta.providersPerReq).toEqual(defaultProvidersPerReq);
    expect(initMeta.providersPerRou.slice(-1)).toEqual([Service2]);
    expect(baseMeta.providersPerMod.includes(Service1)).toBeTruthy();
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

    @initRest({ providersPerRou: [Service3, Service2], exports: [Service3] })
    @featureModule({ imports: [Module1] })
    class Module2 {}

    @rootModule({
      imports: [Module1, Module2],
    })
    class AppModule {}

    const mMetadataPerMod2 = getMetadataPerMod2(AppModule);
    const { baseMeta } = mMetadataPerMod2.get(AppModule)!;
    const initMeta = baseMeta.initMeta.get(initRest)!;
    expect(initMeta.providersPerReq).toEqual(defaultProvidersPerReq);
    expect(initMeta.providersPerRou.slice(-2)).toEqual([Service2, Service3]);
    expect(baseMeta.providersPerMod.includes(Service1)).toBeTruthy();
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
    class Module3 {}

    const mMetadataPerMod2 = getMetadataPerMod2(Module3);
    const { baseMeta } = mMetadataPerMod2.get(Module3)!;
    const initMeta = baseMeta.initMeta.get(initRest)!;
    const injector = Injector.resolveAndCreate(initMeta.providersPerRou);
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

    @initRest({ providersPerRou: [Service1], exports: [Service1] })
    @featureModule()
    class Module1 {}

    @initRest({ providersPerRou: [Service2], exports: [Service2] })
    @rootModule({ imports: [Module1] })
    class Module2 {}

    const mMetadataPerMod2 = getMetadataPerMod2(Module2);
    const { baseMeta } = mMetadataPerMod2.get(Module2)!;
    const initMeta = baseMeta.initMeta.get(initRest)!;
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

    const mod1WithParams: ModuleWithInitParams = { module: Module1, initParams: new Map() };
    mod1WithParams.initParams.set(initRest, { guards: [BearerGuard1] });
    const provider: Provider = { token: BearerGuard1, useClass: BearerGuard2 };

    @initRest({ providersPerRou: [provider, Service0, Service2] })
    @rootModule({ imports: [mod1WithParams] })
    class AppModule {}

    const mMetadataPerMod2 = getMetadataPerMod2(AppModule);
    const mod1 = mMetadataPerMod2.get(mod1WithParams);
    const restMetadataPerMod2 = mod1?.deepImportedModules.get(initRest) as RestMetadataPerMod2;
    expect(restMetadataPerMod2.guards1.at(0)?.guard).toBe(BearerGuard1);

    // Guards per a module must have ref to host module meta.
    expect(restMetadataPerMod2.guards1.at(0)?.baseMeta).toBe(mMetadataPerMod2.get(AppModule)!.baseMeta);

    // The injector must have enough providers to create a guard instance.
    const injector = Injector.resolveAndCreate(restMetadataPerMod2.guards1.at(0)?.meta.providersPerRou || []);
    expect(() => injector.get(BearerGuard1)).not.toThrow();
    expect(injector.get(BearerGuard1)).toBeInstanceOf(BearerGuard2);

    // Corresponding values are created for the entire chain of dependencies.
    const { id } = KeyRegistry.get(Service0);
    expect(injector.getValue(id)).toBeInstanceOf(Service0);
  });
});
