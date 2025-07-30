import {
  AnyObj,
  clearDebugClassNames,
  featureModule,
  forwardRef,
  GlobalProviders,
  injectable,
  MetadataPerMod1,
  ModRefId,
  ModuleManager,
  ModuleType,
  ModuleWithParams,
  NormalizedMeta,
  Provider,
  rootModule,
  SystemLogMediator,
  ShallowModulesImporter as ShallowModulesImporterBase,
} from '@ditsmod/core';

import { controller } from '#types/controller.js';
import { AppendsWithParams } from './rest-init-raw-meta.js';
import { initRest } from '#decorators/rest-init-hooks-and-metadata.js';
import { ShallowModulesImporter } from './shallow-modules-importer.js';
import { Level, RestGlobalProviders } from '#types/types.js';
import { getImportedProviders } from '../utils/get-imports.js';

/**
 * @todo Rename this.
 */
export class ImportObj<T extends Provider = Provider> {
  modRefId: ModRefId;
  /**
   * This property can have more than one element for multi-providers only.
   */
  providers: T[] = [];
}

@injectable()
class MockShallowModulesImporter extends ShallowModulesImporter {
  declare prefixPerMod: string;
  override moduleName = 'MockModule';
  override baseMeta = new NormalizedMeta();
  override shallowImportsBase = new Map<ModuleType, MetadataPerMod1>();
  override importedProvidersPerRou = new Map<any, ImportObj>();
  override importedProvidersPerReq = new Map<any, ImportObj>();
  override importedMultiProvidersPerRou = new Map<ModRefId, Provider[]>();
  override importedMultiProvidersPerReq = new Map<ModRefId, Provider[]>();
  // override guards1: GuardPerMod1[] = [];

  override exportGlobalProviders(config: {
    moduleManager: ModuleManager;
    globalProviders: GlobalProviders;
    baseMeta: NormalizedMeta;
  }): RestGlobalProviders {
    return super.exportGlobalProviders(config);
  }

  protected override getResolvedCollisionsPerLevel(
    level: Level,
    token1: any,
  ): { module2: ModuleType | ModuleWithParams<AnyObj>; providers: Provider[] } {
    return super.getResolvedCollisionsPerLevel(level, token1);
  }
}

let mock: MockShallowModulesImporter;
let moduleManager: ModuleManager;

beforeEach(() => {
  clearDebugClassNames();
  mock = new MockShallowModulesImporter();
  moduleManager = new ModuleManager(new SystemLogMediator({ moduleName: 'fakeName' }));
});

describe('shallow importing modules', () => {
  function importModulesShallow(modRefId: ModuleType) {
    expect(() => moduleManager.scanRootModule(modRefId)).not.toThrow();
    const shallowImportsBase = new ShallowModulesImporterBase().importModulesShallow({
      globalProviders: new GlobalProviders(),
      modRefId,
      moduleManager,
      unfinishedScanModules: new Set(),
    });
    const globalProviders = new ShallowModulesImporterBase().exportGlobalProviders(moduleManager);
    return mock.importModulesShallow({
      modRefId: modRefId,
      globalProviders,
      providersPerApp: [],
      unfinishedScanModules: new Set(),
      shallowImportsBase,
      prefixPerMod: '',
    });
  }

  it('cyclic dependecies between modules', () => {
    class Provider1 {}
    class Provider2 {}

    const moduleWithParams0: ModuleWithParams = { module: forwardRef(() => Module3) };
    @initRest()
    @featureModule({
      imports: [moduleWithParams0],
      exports: [moduleWithParams0],
    })
    class Module1 {}
    const moduleWithParams1: ModuleWithParams = { module: Module1 };

    @initRest({
      providersPerReq: [Provider1],
      exports: [Provider1],
    })
    @featureModule({ imports: [moduleWithParams1], exports: [moduleWithParams1] })
    class Module2 {}
    const moduleWithParams2: ModuleWithParams = { module: Module2 };

    @initRest({
      providersPerReq: [Provider2],
      exports: [Provider2],
    })
    @featureModule({ imports: [moduleWithParams2], exports: [moduleWithParams2] })
    class Module3 {}

    @rootModule({
      imports: [Module3],
      exports: [Module3],
    })
    class AppModule {}

    const baseMeta = moduleManager.scanRootModule(AppModule);
    const initHooks = baseMeta.allInitHooks.get(initRest)!;
    const val: RestGlobalProviders = initHooks.exportGlobalProviders({
      moduleManager,
      globalProviders: new GlobalProviders(),
      baseMeta,
    });
    expect(getImportedProviders(val.importedProvidersPerReq)).toEqual([Provider2, Provider1]);
  });

  it('should throw an error because resolvedCollisionsPerReq not properly setted provider', () => {
    class Provider1 {}
    class Provider2 {}

    @featureModule({
      providersPerMod: [Provider2],
      exports: [Provider2],
    })
    class Module0 {}

    @initRest({ providersPerReq: [{ token: Provider1, useValue: 'some value' }], exports: [Provider1] })
    @featureModule()
    class Module1 {}

    @initRest({ providersPerReq: [Provider1], exports: [Provider1] })
    @featureModule()
    class Module2 {}

    @initRest({
      resolvedCollisionsPerReq: [[Provider1, Module0]],
    })
    @rootModule({ imports: [Module0, Module1, Module2] })
    class AppModule {}

    const msg = 'Provider1 mapped with Module0, but Module0 does not exports Provider1';
    expect(() => importModulesShallow(AppModule)).toThrow(msg);
  });

  it('should throw an error because AppModule have resolvedCollisionsPerReq when there is no collisions', () => {
    class Provider1 {}
    class Provider2 {}

    @initRest({ providersPerReq: [Provider1], exports: [Provider1] })
    @featureModule()
    class Module1 {}

    @initRest({ providersPerReq: [Provider2], exports: [Provider2] })
    @featureModule()
    class Module2 {}

    @initRest({ resolvedCollisionsPerReq: [[Provider1, Module1]] })
    @rootModule({ imports: [Module1, Module2] })
    class AppModule {}

    const msg = 'Provider1 mapped with Module1, but there are no collisions with Provider1 in the providersPerReq';
    expect(() => importModulesShallow(AppModule)).toThrow(msg);
  });

  it('should work with resolved collision', () => {
    class Provider1 {}
    class Provider2 {}

    @initRest({ providersPerReq: [Provider1], exports: [Provider1] })
    @featureModule()
    class Module1 {}

    @initRest({
      providersPerReq: [{ token: Provider1, useValue: 'some value' }, Provider2],
      exports: [Provider1, Provider2],
    })
    @featureModule()
    class Module2 {}

    @rootModule({
      imports: [Module1, Module2],
    })
    class AppModule {}

    let msg =
      'Importing providers to AppModule failed: exports from Module1, Module2 causes collision with Provider1. ';
    msg += 'You should add Provider1 to resolvedCollisionsPerReq in this module. ';
    msg += 'For example: resolvedCollisionsPerReq: [ [Provider1, Module1] ].';
    expect(() => importModulesShallow(AppModule)).toThrow(msg);
  });

  it('should work with resolved collision', () => {
    class Provider1 {}

    @initRest({ providersPerReq: [{ token: Provider1, useValue: 'some value' }], exports: [Provider1] })
    @featureModule()
    class Module1 {}

    @initRest({ providersPerReq: [Provider1], exports: [Provider1] })
    @featureModule()
    class Module2 {}

    const modRefId1: ModuleWithParams = { module: Module1 };
    const modRefId2: ModuleWithParams = { module: Module2 };
    @initRest({
      resolvedCollisionsPerReq: [[Provider1, modRefId1]],
    })
    @rootModule({ imports: [modRefId1, modRefId2] })
    class AppModule {}

    expect(() => importModulesShallow(AppModule)).not.toThrow();
  });

  it('should work with resolved collision in initRest and import a module in rootModule', () => {
    class Provider1 {}

    @initRest({ providersPerReq: [{ token: Provider1, useValue: 'some value' }], exports: [Provider1] })
    @featureModule()
    class Module1 {}

    @initRest({ providersPerReq: [Provider1], exports: [Provider1] })
    @featureModule()
    class Module2 {}

    const modRefId1: ModuleWithParams = { module: Module1 };
    const modRefId2: ModuleWithParams = { module: Module2 };
    @initRest({ resolvedCollisionsPerReq: [[Provider1, modRefId1]] })
    @rootModule({ imports: [modRefId1, modRefId2] })
    class AppModule {}

    expect(() => importModulesShallow(AppModule)).not.toThrow();
  });

  it('should not throw an error during appending modules', () => {
    @controller()
    class Controller1 {}

    @initRest({ controllers: [Controller1] })
    @featureModule()
    class Module1 {}

    @initRest({ controllers: [Controller1] })
    @featureModule()
    class Module2 {}

    @initRest({
      appends: [Module1, { path: 'some-prefix', module: Module2 }],
      controllers: [Controller1],
    })
    @rootModule()
    class AppModule {}

    expect(() => importModulesShallow(AppModule)).not.toThrow();
  });

  it('map should have some properties', () => {
    @controller()
    class Controller1 {}

    @initRest({ controllers: [Controller1] })
    @featureModule()
    class Module1 {}

    @initRest({ controllers: [Controller1] })
    @featureModule()
    class Module2 {}

    const mod1: AppendsWithParams = { path: 'prefix1', module: Module1 };
    const mod2: AppendsWithParams = { path: 'prefix2', module: Module2 };
    @initRest({
      appends: [mod1, mod2],
      controllers: [Controller1],
    })
    @rootModule()
    class AppModule {}

    const map = importModulesShallow(AppModule);
    expect(map.size).toBe(3);

    const metadataPerMod1_1 = map.get(mod1)!;
    const metadataPerMod1_2 = map.get(mod2)!;
    const metadataPerMod1_3 = map.get(AppModule)!;
    expect(metadataPerMod1_1).toBeDefined();
    expect(metadataPerMod1_2).toBeDefined();
    expect(metadataPerMod1_3).toBeDefined();

    expect(metadataPerMod1_1.prefixPerMod).toBe('prefix1');
    expect(metadataPerMod1_1.baseMeta).toBeDefined();
    // expect(metadataPerMod1_1.applyControllers).toBe(true);
    expect(metadataPerMod1_1.importedTokensMap.perRou).toEqual(new Map());
    expect(metadataPerMod1_1.importedTokensMap.perReq).toEqual(new Map());
    expect(metadataPerMod1_1.importedTokensMap.multiPerRou).toEqual(new Map());
    expect(metadataPerMod1_1.importedTokensMap.multiPerReq).toEqual(new Map());

    expect(metadataPerMod1_2.prefixPerMod).toBe('prefix2');
    expect(metadataPerMod1_3.prefixPerMod).toBe('');
    // expect(metadataPerMod1_2.applyControllers).toBe(true);
    // expect(metadataPerMod1_3.applyControllers).toBe(false);
  });

  it('should throw an error during importing and appending same module', () => {
    @controller()
    class Controller1 {}

    @initRest({ controllers: [Controller1] })
    @featureModule()
    class Module1 {}

    @initRest({
      appends: [Module1],
      controllers: [Controller1],
    })
    @rootModule({ imports: [Module1] })
    class AppModule {}

    const msg = 'Appends to "AppModule" failed: "Module1" includes in both: imports and appends arrays';
    expect(() => importModulesShallow(AppModule)).toThrow(msg);
  });

  it('should throw an error during appending module without controllers (common module)', () => {
    class Provider1 {}
    class Provider2 {}
    @controller()
    class Controller1 {}

    @featureModule({
      providersPerMod: [Provider1, Provider2],
      exports: [Provider1, Provider2],
    })
    class Module1 {}

    @initRest({
      appends: [Module1],
      controllers: [Controller1],
    })
    @rootModule()
    class AppModule {}

    const msg = 'Appends to "AppModule" failed: "Module1" must have controllers';
    expect(() => importModulesShallow(AppModule)).toThrow(msg);
  });

  it('should throw an error during appending module without controllers (AppendsWithParams)', () => {
    class Provider1 {}
    class Provider2 {}

    @featureModule({
      providersPerMod: [Provider1, Provider2],
      exports: [Provider1, Provider2],
    })
    class Module1 {}

    @initRest({
      appends: [{ path: '', module: Module1 }],
    })
    @rootModule()
    class AppModule {}

    const msg = 'Appends to "AppModule" failed: "Module1" must have controllers';
    expect(() => importModulesShallow(AppModule)).toThrow(msg);
  });

  it('should not throw an error during appending module with controllers', () => {
    class Provider1 {}
    class Provider2 {}
    @controller()
    class Controller1 {}

    @initRest({ controllers: [Controller1] })
    @featureModule({
      providersPerMod: [Provider1, Provider2],
      exports: [Provider1, Provider2],
    })
    class Module1 {}

    @initRest({
      appends: [Module1],
      controllers: [Controller1],
    })
    @rootModule()
    class AppModule {}

    expect(() => importModulesShallow(AppModule)).not.toThrow();
  });

  it('should not throw an error during appending modules', () => {
    @controller()
    class Controller1 {}

    @initRest({ controllers: [Controller1] })
    @featureModule()
    class Module1 {}

    @initRest({ controllers: [Controller1] })
    @featureModule()
    class Module2 {}

    @initRest({
      appends: [Module1, { path: 'some-prefix', module: Module2 }],
      controllers: [Controller1],
    })
    @rootModule()
    class AppModule {}

    expect(() => importModulesShallow(AppModule)).not.toThrow();
  });

  it('map should have some properties', () => {
    @controller()
    class Controller1 {}

    @initRest({ controllers: [Controller1] })
    @featureModule()
    class Module1 {}

    @initRest({ controllers: [Controller1] })
    @featureModule()
    class Module2 {}

    const mod1: AppendsWithParams = { path: 'prefix1', module: Module1 };
    const mod2: AppendsWithParams = { path: 'prefix2', module: Module2 };
    @initRest({
      appends: [mod1, mod2],
      controllers: [Controller1],
    })
    @rootModule()
    class AppModule {}

    const map = importModulesShallow(AppModule);
    expect(map.size).toBe(3);

    const metadataPerMod1_1 = map.get(mod1)!;
    const metadataPerMod1_2 = map.get(mod2)!;
    const metadataPerMod1_3 = map.get(AppModule)!;
    expect(metadataPerMod1_1).toBeDefined();
    expect(metadataPerMod1_2).toBeDefined();
    expect(metadataPerMod1_3).toBeDefined();

    expect(metadataPerMod1_1.prefixPerMod).toBe('prefix1');
    expect(metadataPerMod1_1.baseMeta).toBeDefined();
    // expect(metadataPerMod1_1.applyControllers).toBe(true);
    expect(metadataPerMod1_1.importedTokensMap.perRou).toEqual(new Map());
    expect(metadataPerMod1_1.importedTokensMap.perReq).toEqual(new Map());
    expect(metadataPerMod1_1.importedTokensMap.multiPerRou).toEqual(new Map());
    expect(metadataPerMod1_1.importedTokensMap.multiPerReq).toEqual(new Map());

    expect(metadataPerMod1_2.prefixPerMod).toBe('prefix2');
    expect(metadataPerMod1_3.prefixPerMod).toBe('');
    // expect(metadataPerMod1_2.applyControllers).toBe(true);
    // expect(metadataPerMod1_3.applyControllers).toBe(false);
  });
});
