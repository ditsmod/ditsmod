import { jest } from '@jest/globals';

import { injectable, forwardRef, Provider, isMultiProvider } from '#di';
import { featureModule } from '#decorators/feature-module.js';
import { rootModule } from '#decorators/root-module.js';
import { Extension } from '#extension/extension-types.js';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { CallsiteUtils } from '#utils/callsites.js';
import { ModuleManager } from './module-manager.js';
import { ModuleType, AnyObj, ModRefId } from '#types/mix.js';
import { ModuleWithParams } from '#types/module-metadata.js';
import { NormalizedMeta } from '#types/normalized-meta.js';
import { clearDebugClassNames } from '#utils/get-debug-class-name.js';

describe('ModuleManager', () => {
  console.log = jest.fn();
  type ModuleId = string | ModuleType | ModuleWithParams;
  @injectable()
  class Provider0 {}
  @injectable()
  class Provider1 {}
  @injectable()
  class Provider2 {}
  @injectable()
  class Provider3 {}

  class MockModuleManager extends ModuleManager {
    declare map: Map<ModuleType | ModuleWithParams, NormalizedMeta>;
    declare mapId: Map<string, ModuleType | ModuleWithParams>;
    declare oldMap: Map<ModuleType | ModuleWithParams, NormalizedMeta>;
    declare oldMapId: Map<string, ModuleType | ModuleWithParams>;

    override getOriginMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
      moduleId: ModuleId,
      throwErrIfNotFound?: boolean,
    ): NormalizedMeta | undefined;

    override getOriginMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
      moduleId: ModuleId,
      throwErrIfNotFound: true,
    ): NormalizedMeta;

    override getOriginMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
      moduleId: ModuleId,
      throwErrOnNotFound?: boolean,
    ) {
      return super.getOriginMetadata<T, A>(moduleId, throwErrOnNotFound);
    }

    override normalizeMetadata(modRefId: ModRefId): NormalizedMeta {
      return super.normalizeMetadata(modRefId);
    }
  }

  let mock: MockModuleManager;

  beforeEach(() => {
    clearDebugClassNames();
    jest.resetAllMocks();
    const systemLogMediator = new SystemLogMediator({ moduleName: 'fakeName' });
    mock = new MockModuleManager(systemLogMediator);
    jest.spyOn(mock, 'normalizeMetadata');
  });

  it('root module must scan very first (because of moduleNormalizer.checkAndMarkExternalModule())', () => {
    class Service1 {}
    class Service2 {}
    @featureModule({
      providersPerApp: [Service1],
      imports: [Module1],
    })
    class Module1 {}

    @featureModule({
      providersPerApp: [Service2],
      imports: [Module1],
    })
    class Module2 {}

    @rootModule({
      imports: [Module2],
    })
    class AppModule {}

    mock.scanRootModule(AppModule);
    expect(mock.normalizeMetadata).toHaveBeenNthCalledWith(1, AppModule);
    expect(mock.normalizeMetadata).toHaveBeenNthCalledWith(2, Module2);
    expect(mock.normalizeMetadata).toHaveBeenNthCalledWith(3, Module1);
  });

  describe('providersPerApp', () => {
    class Provider0 {}
    class Provider1 {}
    class Provider2 {}
    class Provider3 {}
    class Provider4 {}
    class Provider5 {}
    class Provider6 {}
    class Provider7 {}

    @featureModule({ providersPerApp: [Provider0] })
    class Module0 {}

    @featureModule({ providersPerApp: [Provider1] })
    class Module1 {}

    @featureModule({
      providersPerApp: [Provider2, Provider3, Provider4],
      imports: [Module1],
    })
    class Module2 {}

    @featureModule({
      providersPerApp: [Provider5, Provider6],
      imports: [Module2],
    })
    class Module3 {}

    @rootModule({
      imports: [Module3, Module0],
      providersPerApp: [{ token: Provider1, useClass: Provider7 }],
      exports: [Module0],
    })
    class AppModule {}

    it('should collects providers from exports array without imports them', () => {
      mock.scanRootModule(AppModule);
      const providersPerApp = mock.providersPerApp;
      expect(providersPerApp.includes(Provider0)).toBe(true);
    });

    it('should collects providers in particular order', () => {
      mock.scanRootModule(AppModule);
      const providersPerApp = mock.providersPerApp;
      expect(providersPerApp).toEqual([Provider1, Provider2, Provider3, Provider4, Provider5, Provider6, Provider0]);
    });

    it('should works with baseModuleWithParams', () => {
      @featureModule({})
      class Module6 {
        static withParams(providers: Provider[]): ModuleWithParams<Module6> {
          return {
            module: Module6,
            providersPerApp: providers,
          };
        }
      }
      const modWithParams = Module6.withParams([Provider7]);
      mock.scanModule(modWithParams);
      const providersPerApp = mock.providersPerApp;
      expect(providersPerApp).toEqual([Provider7]);
    });
  });

  it('circular imports modules "Module1 -> Module3 -> Module2 -> Module1" with forwardRef()', () => {
    @featureModule({ providersPerApp: [Provider1], imports: [forwardRef(() => Module3)] })
    class Module1 {}

    @featureModule({ imports: [Module1], providersPerApp: [{ token: 'token2', useValue: 'value2' }] })
    class Module2 {}

    @featureModule({ imports: [Module2], providersPerApp: [{ token: 'token3', useValue: 'value3' }] })
    class Module3 {}

    @featureModule({ imports: [Module3], providersPerApp: [{ token: 'token4', useValue: 'value4' }] })
    class Module4 {}

    @rootModule({
      providersPerApp: [Provider1],
      imports: [Module4],
    })
    class AppModule {}

    expect(() => mock.scanRootModule(AppModule)).not.toThrow();
    expect(mock.getMetadata(Module1)).toMatchObject<Partial<NormalizedMeta>>({
      importsModules: [Module3],
    });
    expect(mock.getMetadata(Module3)).toMatchObject<Partial<NormalizedMeta>>({
      importsModules: [Module2],
    });
  });

  it('exports provider that is not declared in current module', () => {
    @rootModule({
      exports: [Provider1],
    })
    class AppModule {}

    expect(() => mock.scanRootModule(AppModule)).toThrow('if "Provider1" is a provider, it must be included in');
  });

  it('root module with some metadata', () => {
    @rootModule({
      imports: [],
      providersPerMod: [Provider1],
      extensionsMeta: {},
      exports: [],
    })
    class AppModule {}

    const expectedMeta = new NormalizedMeta();
    expectedMeta.id = '';
    expectedMeta.name = 'AppModule';
    expectedMeta.modRefId = AppModule;
    expectedMeta.providersPerMod = [Provider1];
    expectedMeta.decorator = rootModule;
    expectedMeta.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta.isExternal = false;
    expectedMeta.initHooksAndRawMeta = expect.any(Map);

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(1);
    expect(mock.getMetadata('root')).toEqual(expectedMeta);
  });

  it('scan module as root module without @rootModule decorator', () => {
    @featureModule()
    class Module1 {}

    expect(() => mock.scanRootModule(Module1)).toThrow('"Module1" does not have the "@rootModule()" decorator');
  });

  it('root module imports a module that not have @featureModule decorator', () => {
    class Module1 {}

    @rootModule({ imports: [Module1] })
    class Module2 {}

    const msg = '"Module1" does not have the "@rootModule()" or "@featureModule()" decorator';
    expect(() => mock.scanRootModule(Module2)).toThrow(msg);
  });

  it('properly reexport a module', () => {
    @featureModule({ providersPerMod: [Provider1], exports: [Provider1] })
    class Module1 {}

    @featureModule({
      imports: [Module1],
      exports: [Module1],
    })
    class Module2 {}

    expect(() => mock.scanModule(Module2)).not.toThrow();
  });

  it('reexport same object of module with params', () => {
    @featureModule({ providersPerMod: [Provider1], exports: [Provider1] })
    class Module1 {}
    const baseModuleWithParams: ModuleWithParams = { module: Module1, providersPerMod: [] };

    @featureModule({
      imports: [baseModuleWithParams],
      exports: [baseModuleWithParams],
    })
    class Module2 {}

    expect(() => mock.scanModule(Module2)).not.toThrow();
    expect(mock.getMetadata(baseModuleWithParams)).toMatchObject<Partial<NormalizedMeta>>({
      modRefId: baseModuleWithParams,
    });
    expect(mock.getMetadata(Module1)).toBeUndefined();
  });

  it('exports multi providers', () => {
    class Multi {}

    const exportedMultiProvidersPerMod: Provider[] = [{ token: Multi, useClass: Multi, multi: true }];

    @featureModule()
    class Module1 {
      static withParams(): ModuleWithParams<Module1> {
        return {
          module: this,
          providersPerMod: [{ token: Multi, useClass: Multi, multi: true }],
          exports: [Multi],
        };
      }
    }

    const baseModuleWithParams = Module1.withParams();

    const meta = mock.scanModule(baseModuleWithParams);
    expect(meta.exportedProvidersPerMod.length).toBe(0);
    expect(meta.exportedMultiProvidersPerMod).toEqual(exportedMultiProvidersPerMod);
  });

  it('root module with imported some other modules', () => {
    const fn = () => module4WithParams;
    @featureModule({ id: '1', imports: [forwardRef(fn)], providersPerMod: [Provider1], exports: [Provider1] })
    class Module1 {}

    @featureModule({
      imports: [Module1],
      providersPerMod: [Provider0, Provider1],
      exports: [Provider0, Provider1, Module1],
    })
    class Module2 {}

    @featureModule({ providersPerMod: [Provider1], exports: [Provider1] })
    class Module4 {
      static withParams(providersPerMod: Provider[]): ModuleWithParams<Module4> {
        return {
          module: Module4,
          providersPerMod,
        };
      }
    }

    const module4WithParams = Module4.withParams([Provider2]);

    @rootModule({
      imports: [Module1, Module2],
      providersPerApp: [],
      extensionsMeta: {},
      exports: [],
    })
    class Module3 {}

    const expectedMeta1 = new NormalizedMeta();
    expectedMeta1.id = '1';
    expectedMeta1.name = 'Module1';
    expectedMeta1.modRefId = Module1;
    expectedMeta1.providersPerMod = [Provider1];
    expectedMeta1.exportedProvidersPerMod = [Provider1];
    expectedMeta1.importsWithParams = [module4WithParams];
    expectedMeta1.decorator = featureModule;
    expectedMeta1.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta1.isExternal = false;
    expectedMeta1.initHooksAndRawMeta = expect.any(Map);

    mock.scanRootModule(Module3);
    expect(mock.map.size).toBe(4);
    expect(mock.getMetadata('1')).toEqual(expectedMeta1);

    const expectedMeta2 = new NormalizedMeta();
    expectedMeta2.id = '';
    expectedMeta2.name = 'Module2';
    expectedMeta2.modRefId = Module2;
    expectedMeta2.importsModules = [Module1];
    expectedMeta2.providersPerMod = [Provider0, Provider1];
    expectedMeta2.exportsModules = [Module1];
    expectedMeta2.exportedProvidersPerMod = [Provider0, Provider1];
    expectedMeta2.decorator = featureModule;
    expectedMeta2.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta2.isExternal = false;
    expectedMeta2.initHooksAndRawMeta = expect.any(Map);

    expect(mock.map.get(Module2)).toEqual(expectedMeta2);

    const expectedMeta3 = new NormalizedMeta();
    expectedMeta3.id = '';
    expectedMeta3.name = 'Module3';
    expectedMeta3.modRefId = Module3;
    expectedMeta3.importsModules = [Module1, Module2];
    expectedMeta3.decorator = rootModule;
    expectedMeta3.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta3.isExternal = false;
    expectedMeta3.initHooksAndRawMeta = expect.any(Map);

    expect(mock.getMetadata('root')).toEqual(expectedMeta3);

    const expectedMeta4 = new NormalizedMeta();
    expectedMeta4.exportedProvidersPerMod = [Provider1];
    expectedMeta4.id = '';
    expectedMeta4.name = 'Module4';
    expectedMeta4.providersPerMod = [Provider1, Provider2];
    expectedMeta4.modRefId = module4WithParams;
    expectedMeta4.decorator = featureModule;
    expectedMeta4.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta4.isExternal = false;
    expectedMeta4.initHooksAndRawMeta = expect.any(Map);

    expect(mock.map.get(module4WithParams)).toEqual(expectedMeta4);
  });

  it('programmatically adding some modules to "imports" array of root module', () => {
    @rootModule({
      imports: [],
      providersPerMod: [Provider1],
      extensionsMeta: {},
      exports: [],
    })
    class AppModule {}

    @featureModule({ providersPerMod: [Provider1], exports: [Provider1] })
    class Module1 {}

    @featureModule({ providersPerMod: [Provider1], exports: [Provider1] })
    class Module2 {}

    @featureModule({ providersPerMod: [Provider1], exports: [Provider1] })
    class Module3 {
      static withParams(providersPerMod: Provider[]): ModuleWithParams<Module3> {
        return {
          module: Module3,
          providersPerMod,
        };
      }
    }

    @featureModule({ providersPerMod: [Provider1], exports: [Provider1] })
    class Module4 {}

    const module3WithProviders = Module3.withParams([Provider2]);

    const expectedMeta1 = new NormalizedMeta();
    expectedMeta1.id = '';
    expectedMeta1.name = 'AppModule';
    expectedMeta1.modRefId = AppModule;
    expectedMeta1.providersPerMod = [Provider1];
    expectedMeta1.decorator = rootModule;
    expectedMeta1.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta1.isExternal = false;
    expectedMeta1.initHooksAndRawMeta = expect.any(Map);

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(1);
    expect(mock.getMetadata('root')).not.toBe(mock.getMetadata('root'));
    expect(mock.getOriginMetadata('root')).toBe(mock.getOriginMetadata('root'));
    expect(mock.getMetadata('root')).toEqual(expectedMeta1);

    expect(mock.addImport(Module1)).toBe(true);
    expect(mock.map.size).toBe(2);
    expect(mock.map.has(Module1)).toBe(true);
    expect(mock.oldMapId.size).toBe(1);
    expect(mock.oldMapId.get('root')).toBe(AppModule);
    expect(mock.oldMap.size).toBe(1);
    expect(mock.oldMap.get(AppModule)).toEqual(expectedMeta1);

    expect(mock.addImport(Module1)).toBe(false);
    expect(mock.oldMap.size).toBe(1);
    expect(mock.oldMap.has(AppModule)).toBe(true);
    expect(mock.oldMap.get(AppModule)).toEqual(expectedMeta1);
    expect(mock.map.size).toBe(2);
    expect(mock.map.has(Module1)).toBe(true);

    mock.commit();
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.size).toBe(0);
    expect(mock.map.size).toBe(2);
    expect(mock.map.has(AppModule)).toBe(true);
    expect(mock.map.has(Module1)).toBe(true);

    expect(() => mock.addImport(Module2, 'fakeId')).toThrow(/Failed adding Module2 to imports/);
    expect(mock.map.size).toBe(2);
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.size).toBe(0);

    const expectedMeta2 = new NormalizedMeta();
    expectedMeta2.id = '';
    expectedMeta2.name = 'AppModule';
    expectedMeta2.modRefId = AppModule;
    expectedMeta2.importsModules = [Module1];
    expectedMeta2.providersPerMod = [Provider1];
    expectedMeta2.decorator = rootModule;
    expectedMeta2.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta2.isExternal = false;
    expectedMeta2.initHooksAndRawMeta = expect.any(Map);

    mock.addImport(Module2);
    expect(mock.map.size).toBe(3);
    expect(mock.map.has(Module2)).toBe(true);
    expect(mock.oldMap.size).toBe(2);
    expect(mock.oldMap.has(AppModule)).toBe(true);
    expect(mock.oldMap.has(Module1)).toBe(true);
    expect(mock.oldMapId.size).toBe(1);
    expect(mock.oldMapId.get('root')).toBe(AppModule);
    expect(mock.oldMap.get(AppModule)).toEqual(expectedMeta2);

    mock.addImport(Module4);
    expect(mock.map.size).toBe(4);
    expect(mock.map.has(Module4)).toBe(true);
    expect(mock.oldMap.size).toBe(2);
    expect(mock.oldMap.has(AppModule)).toBe(true);
    expect(mock.oldMap.has(Module1)).toBe(true);
    expect(mock.oldMapId.size).toBe(1);
    expect(mock.oldMapId.get('root')).toBe(AppModule);

    mock.commit();
    expect(mock.map.size).toBe(4);
    expect(mock.map.has(AppModule)).toBe(true);
    expect(mock.map.has(Module1)).toBe(true);
    expect(mock.map.has(Module2)).toBe(true);
    expect(mock.map.has(Module4)).toBe(true);
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.has(AppModule)).toBe(false);

    const expectedMeta3 = new NormalizedMeta();
    expectedMeta3.id = '';
    expectedMeta3.name = 'AppModule';
    expectedMeta3.modRefId = AppModule;
    expectedMeta3.importsModules = [Module1, Module2, Module4];
    expectedMeta3.providersPerMod = [Provider1];
    expectedMeta3.decorator = rootModule;
    expectedMeta3.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta3.isExternal = false;
    expectedMeta3.initHooksAndRawMeta = expect.any(Map);

    expect(mock.getMetadata('root') === mock.getMetadata('root')).toBe(false);
    expect(mock.getMetadata('root')).toEqual(expectedMeta3);

    mock.addImport(module3WithProviders);
    expect(mock.map.size).toBe(5);
    expect(mock.oldMap.size).toBe(4);
    expect(mock.getMetadata('root')).toEqual({ ...expectedMeta3, importsWithParams: [module3WithProviders] });
    expect(mock.map.has(module3WithProviders)).toBe(true);

    mock.rollback();
    expect(mock.map.size).toBe(4);
    expect(mock.getMetadata('root')).toEqual(expectedMeta3);
    expect(mock.map.has(module3WithProviders)).toBe(false);
    expect(mock.oldMap.size).toBe(0);
  });

  it('programmatically removing some modules from "imports" array of root module', () => {
    @featureModule({ providersPerMod: [Provider1], exports: [Provider1] })
    class Module0 {}

    @featureModule({ providersPerMod: [Provider1], exports: [Provider1], imports: [Module0] })
    class Module1 {}

    @featureModule({ providersPerMod: [Provider1], exports: [Provider1], imports: [Module0] })
    class Module2 {}

    @featureModule({ providersPerMod: [Provider1], exports: [Provider1] })
    class Module3 {
      static withParams(providersPerMod: Provider[]): ModuleWithParams<Module3> {
        return {
          module: Module3,
          providersPerMod,
        };
      }
    }

    const module3WithProviders = Module3.withParams([Provider2]);

    const moduleId = 'my-mix';
    @featureModule({ providersPerMod: [Provider1], exports: [Provider1] })
    class Module4 {
      static withParams(providersPerMod: Provider[]): ModuleWithParams<Module4> {
        return {
          id: moduleId,
          module: Module4,
          providersPerMod,
        };
      }
    }

    const module4WithProviders = Module4.withParams([Provider2]);

    @rootModule({
      imports: [Module1, Module2, module3WithProviders, module4WithProviders],
      providersPerMod: [Provider1],
      extensionsMeta: {},
      exports: [],
    })
    class AppModule {}

    const expectedMeta1 = new NormalizedMeta();
    expectedMeta1.id = '';
    expectedMeta1.name = 'AppModule';
    expectedMeta1.modRefId = AppModule;
    expectedMeta1.importsModules = [Module1, Module2];
    expectedMeta1.importsWithParams = [module3WithProviders, module4WithProviders];
    expectedMeta1.providersPerMod = [Provider1];
    expectedMeta1.decorator = rootModule;
    expectedMeta1.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta1.isExternal = false;
    expectedMeta1.initHooksAndRawMeta = expect.any(Map);

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(6);
    expect(mock.getMetadata('root')).toEqual(expectedMeta1);
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.size).toBe(0);
    expect(mock.map.get(Module1)).toMatchObject({ importsModules: [Module0] });

    expect(mock.removeImport(Module0, Module1)).toBe(true);
    expect(mock.map.get(Module1)).toMatchObject({ importsModules: [] });
    expect(mock.map.size).toBe(6);
    expect(mock.map.has(Module0)).toBe(true);
    expect(mock.oldMap.size).toBe(6);
    expect(mock.oldMap.get(Module1)).toMatchObject({ importsModules: [Module0] });
    expect(mock.oldMap.has(Module0)).toBe(true);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMapId.has(moduleId)).toBe(true);
    expect(mock.oldMapId.get('root')).toBe(AppModule);

    expect(mock.map.get(Module2)).toMatchObject({ importsModules: [Module0] });
    expect(mock.removeImport(Module0, Module2)).toBe(true);
    expect(mock.map.get(Module2)).toMatchObject({ importsModules: [] });
    expect(mock.map.size).toBe(5);
    expect(mock.map.has(Module0)).toBe(false);
    expect(mock.oldMap.size).toBe(6);
    expect(mock.oldMap.get(Module2)).toMatchObject({ importsModules: [Module0] });
    expect(mock.oldMap.has(Module0)).toBe(true);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMapId.has(moduleId)).toBe(true);
    expect(mock.oldMapId.get('root')).toBe(AppModule);

    mock.commit();
    expect(mock.map.size).toBe(5);
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.size).toBe(0);

    const expectedMeta2 = new NormalizedMeta();
    expectedMeta2.id = '';
    expectedMeta2.name = 'AppModule';
    expectedMeta2.modRefId = AppModule;
    expectedMeta2.importsModules = [Module1];
    expectedMeta2.importsWithParams = [module3WithProviders, module4WithProviders];
    expectedMeta2.providersPerMod = [Provider1];
    expectedMeta2.decorator = rootModule;
    expectedMeta2.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta2.isExternal = false;
    expectedMeta2.initHooksAndRawMeta = expect.any(Map);

    expect(mock.getMetadata('root')).toMatchObject({ importsModules: [Module1, Module2] });
    expect(mock.removeImport(Module2)).toBe(true);
    expect(mock.getMetadata('root')).toMatchObject({ importsModules: [Module1] });
    expect(mock.map.size).toBe(4);
    expect(mock.oldMap.get(AppModule)).toMatchObject({ importsModules: [Module1, Module2] });
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(5);

    expect(mock.removeImport(Module2)).toBe(false);
    expect(mock.map.size).toBe(4);
    expect(mock.getMetadata('root')).toMatchObject({ importsModules: [Module1] });
    expect(mock.getMetadata('root')).toEqual(expectedMeta2);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(5);

    const expectedMeta3 = new NormalizedMeta();
    expectedMeta3.id = '';
    expectedMeta3.name = 'AppModule';
    expectedMeta3.modRefId = AppModule;
    expectedMeta3.importsModules = [Module1];
    expectedMeta3.importsWithParams = [module4WithProviders];
    expectedMeta3.providersPerMod = [Provider1];
    expectedMeta3.decorator = rootModule;
    expectedMeta3.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta3.isExternal = false;
    expectedMeta3.initHooksAndRawMeta = expect.any(Map);

    expect(mock.getMetadata('root')).toMatchObject({
      importsWithParams: [module3WithProviders, module4WithProviders],
    });
    expect(mock.removeImport(module3WithProviders)).toBe(true);
    expect(mock.getMetadata('root')).toMatchObject({ importsWithParams: [module4WithProviders] });
    expect(mock.map.size).toBe(3);
    expect(mock.getMetadata('root')).toEqual(expectedMeta3);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(5);
    expect(mock.oldMap.get(AppModule)).toMatchObject({
      importsWithParams: [module3WithProviders, module4WithProviders],
    });

    const expectedMeta4 = new NormalizedMeta();
    expectedMeta4.id = '';
    expectedMeta4.name = 'AppModule';
    expectedMeta4.modRefId = AppModule;
    expectedMeta4.importsModules = [Module1];
    expectedMeta4.providersPerMod = [Provider1];
    expectedMeta4.decorator = rootModule;
    expectedMeta4.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta4.isExternal = false;
    expectedMeta4.initHooksAndRawMeta = expect.any(Map);

    expect(mock.removeImport(moduleId)).toBe(true);
    expect(mock.map.size).toBe(2);
    expect(mock.getMetadata('root')).toEqual(expectedMeta4);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(5);

    mock.rollback();
    expect(mock.mapId.size).toBe(2);
    expect(mock.map.size).toBe(5);
    expect(mock.getMetadata('root')).toEqual(expectedMeta1);
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.size).toBe(0);
  });

  it('root module with imported some extension', () => {
    @injectable()
    class Extension1 implements Extension<void> {
      async stage1() {}
    }

    const extensionsProviders: Provider[] = [Extension1];

    @featureModule({
      extensions: [{ extension: Extension1 as any, export: true }],
    })
    class Module1 {}

    @rootModule({
      imports: [Module1],
    })
    class Module3 {}

    const expectedMeta3 = new NormalizedMeta();
    expectedMeta3.id = '';
    expectedMeta3.name = 'Module3';
    expectedMeta3.modRefId = Module3;
    expectedMeta3.importsModules = [Module1];
    expectedMeta3.decorator = rootModule;
    expectedMeta3.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta3.isExternal = false;
    expectedMeta3.initHooksAndRawMeta = expect.any(Map);
    delete (expectedMeta3 as any).aExtensionConfig;
    delete (expectedMeta3 as any).aExportedExtensionConfig;

    const expectedMeta1 = new NormalizedMeta();
    expectedMeta1.id = '';
    expectedMeta1.name = 'Module1';
    expectedMeta1.modRefId = Module1;
    expectedMeta1.extensionsProviders = extensionsProviders;
    expectedMeta1.exportedExtensionsProviders = extensionsProviders;
    expectedMeta1.decorator = featureModule;
    expectedMeta1.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta1.isExternal = false;
    delete (expectedMeta1 as any).aExtensionConfig;
    delete (expectedMeta1 as any).aExportedExtensionConfig;
    expectedMeta1.initHooksAndRawMeta = expect.any(Map);

    mock.scanRootModule(Module3);
    expect(mock.getMetadata('root')).toMatchObject(expectedMeta3);
    expect(mock.getMetadata(Module1)).toMatchObject(expectedMeta1);
  });

  it('root module with exported globaly some extension', () => {
    @injectable()
    class Extension1 implements Extension<void> {
      async stage1() {}
    }

    const extensionsProviders: Provider[] = [Extension1];

    @featureModule({
      extensions: [{ extension: Extension1 as any, export: true }],
    })
    class Module1 {}

    @rootModule({
      imports: [Module1],
      exports: [Module1],
    })
    class Module3 {}

    const expectedMeta3 = new NormalizedMeta();
    expectedMeta3.id = '';
    expectedMeta3.name = 'Module3';
    expectedMeta3.modRefId = Module3;
    expectedMeta3.importsModules = [Module1];
    expectedMeta3.exportsModules = [Module1];
    expectedMeta3.decorator = rootModule;
    expectedMeta3.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta3.isExternal = false;
    expectedMeta3.initHooksAndRawMeta = expect.any(Map);
    delete (expectedMeta3 as any).aExtensionConfig;
    delete (expectedMeta3 as any).aExportedExtensionConfig;

    const expectedMeta1 = new NormalizedMeta();
    expectedMeta1.id = '';
    expectedMeta1.name = 'Module1';
    expectedMeta1.modRefId = Module1;
    expectedMeta1.extensionsProviders = extensionsProviders;
    expectedMeta1.exportedExtensionsProviders = extensionsProviders;
    expectedMeta1.decorator = featureModule;
    expectedMeta1.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta1.isExternal = false;
    expectedMeta1.initHooksAndRawMeta = expect.any(Map);
    delete (expectedMeta1 as any).aExtensionConfig;
    delete (expectedMeta1 as any).aExportedExtensionConfig;

    mock.scanRootModule(Module3);
    expect(mock.getMetadata('root')).toMatchObject(expectedMeta3);
    expect(mock.getMetadata(Module1)).toMatchObject(expectedMeta1);
  });

  it('split multi providers and common providers', () => {
    const providersPerMod: Provider[] = [
      { token: Provider2, useValue: 'val4', multi: true },
      { token: Provider1, useValue: 'val1', multi: true },
      { token: Provider1, useValue: 'val2', multi: true },
      { token: Provider1, useValue: 'val3', multi: true },
      Provider3,
    ];

    @featureModule({
      providersPerMod,
      exports: [Provider2, Provider1, Provider3],
    })
    class Module1 {}

    @rootModule({
      imports: [Module1],
    })
    class Module3 {}

    const expectedMeta3 = new NormalizedMeta();
    expectedMeta3.id = '';
    expectedMeta3.name = 'Module3';
    expectedMeta3.modRefId = Module3;
    expectedMeta3.importsModules = [Module1];
    expectedMeta3.decorator = rootModule;
    expectedMeta3.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta3.isExternal = false;
    expectedMeta3.initHooksAndRawMeta = expect.any(Map);

    const expectedMeta1 = new NormalizedMeta();
    expectedMeta1.id = '';
    expectedMeta1.name = 'Module1';
    expectedMeta1.modRefId = Module1;
    expectedMeta1.providersPerMod = providersPerMod;
    expectedMeta1.exportedProvidersPerMod = [Provider3];
    expectedMeta1.exportedMultiProvidersPerMod = providersPerMod.filter(isMultiProvider);
    expectedMeta1.decorator = featureModule;
    expectedMeta1.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta1.isExternal = false;
    expectedMeta1.initHooksAndRawMeta = expect.any(Map);

    mock.scanRootModule(Module3);
    expect(mock.getMetadata('root')).toEqual(expectedMeta3);
    expect(mock.getMetadata(Module1)).toEqual(expectedMeta1);
  });
});
