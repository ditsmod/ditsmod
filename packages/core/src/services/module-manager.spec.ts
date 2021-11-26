import 'reflect-metadata';
import * as http from 'http';
import { Injectable, forwardRef, InjectionToken } from '@ts-stack/di';

import { RootModule } from '../decorators/root-module';
import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { ModuleManager } from './module-manager';
import { Module } from '../decorators/module';
import { ModuleWithParams, ServiceProvider, ModuleType, AnyObj, Extension, ExtensionsProvider } from '../types/mix';
import { LoggerConfig } from '../types/logger';
import { DefaultLogger } from './default-logger';
import { LogMediator } from './log-mediator';
import { LogManager } from './log-manager';

describe('ModuleManager', () => {
  type ModuleId = string | ModuleType | ModuleWithParams;
  type PartialMeta = Partial<NormalizedModuleMetadata>;

  class MockModuleManager extends ModuleManager {
    override map = new Map<ModuleType | ModuleWithParams, NormalizedModuleMetadata>();
    override mapId = new Map<string, ModuleType | ModuleWithParams>();
    override oldMap = new Map<ModuleType | ModuleWithParams, NormalizedModuleMetadata>();
    override oldMapId = new Map<string, ModuleType | ModuleWithParams>();

    override getRawMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
      moduleId: ModuleId,
      throwErrOnNotFound?: boolean
    ) {
      return super.getRawMetadata<T, A>(moduleId, throwErrOnNotFound);
    }
  }

  let mock: MockModuleManager;

  beforeEach(() => {
    const config = new LoggerConfig();
    const logger = new DefaultLogger(config);
    const logManager = new LogManager();
    const logMediator = new LogMediator(logManager, logger);
    mock = new MockModuleManager(logMediator);
  });

  it('empty root module', () => {
    @RootModule()
    class AppModule {}

    const expectedMeta = new NormalizedModuleMetadata();
    expectedMeta.id = '';
    expectedMeta.name = 'AppModule';
    expectedMeta.module = AppModule;
    expectedMeta.ngMetadataName = 'RootModule';

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(1);
    expect(mock.getMetadata('root')).toEqual(expectedMeta);
  });

  it('circular imports modules', () => {
    @Injectable()
    class Provider1 {}

    @Module({ providersPerApp: [Provider1], imports: [forwardRef(() => Module3)] })
    class Module1 {}

    @Module({ imports: [Module1] })
    class Module2 {}

    @Module({ imports: [Module2] })
    class Module3 {}

    @Module({ imports: [Module3] })
    class Module4 {}

    @RootModule({
      imports: [Module4],
    })
    class AppModule {}

    expect(() => mock.scanRootModule(AppModule)).not.toThrow();
  });

  it('non properly exports from root module', () => {
    class Provider1 {}

    @RootModule({
      exports: [Provider1],
    })
    class AppModule {}

    expect(() => mock.scanRootModule(AppModule)).toThrowError(/if "Provider1" is a provider, it must be included in/);
  });

  it('root module with some metadata', () => {
    @Injectable()
    class Provider1 {}

    @RootModule({
      httpModule: http,
      listenOptions: { host: 'localhost', port: 3000 },
      prefixPerApp: 'api',
      serverName: 'Some-Server',
      serverOptions: {},
      imports: [],
      providersPerRou: [],
      providersPerReq: [Provider1],
      extensionsMeta: {},
      controllers: [],
      exports: [],
    })
    class AppModule {}

    const expectedMeta = new NormalizedModuleMetadata();
    expectedMeta.id = '';
    expectedMeta.name = 'AppModule';
    expectedMeta.module = AppModule;
    expectedMeta.providersPerReq = [Provider1];
    expectedMeta.ngMetadataName = 'RootModule';

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(1);
    expect(mock.getMetadata('root')).toEqual(expectedMeta);
  });

  it('root module without @RootModule decorator', () => {
    @Module()
    class Module1 {}

    expect(() => mock.scanRootModule(Module1)).toThrow(`"Module1" does not have the "@RootModule()" decorator`);
  });

  it('root module imported module without @Module decorator', () => {
    class Module1 {}

    @RootModule({ imports: [Module1] })
    class Module2 {}

    expect(() => mock.scanRootModule(Module2)).toThrow(`"Module1" does not have the "@Module()" decorator`);
  });

  it('module reexported another module without @Module decorator', () => {
    class Module1 {}

    @Module({ imports: [Module1], exports: [Module1] })
    class Module2 {}

    expect(() => mock.scanModule(Module2)).toThrow(/if "Module1" is a provider, it must be included in/);
  });

  it('module exported provider from providersPerApp', () => {
    @Injectable()
    class Provider1 {}

    @Module({ providersPerApp: [Provider1], exports: [Provider1] })
    class Module2 {}

    expect(() => mock.scanModule(Module2)).toThrow(/includes in "providersPerApp" and "exports" of/);
  });

  it('module exported token', () => {
    @Module({ exports: ['someToken'] })
    class Module2 {}

    expect(() => mock.scanModule(Module2)).toThrow(
      `If "someToken" is a token of extension, this extension must be included`
    );
  });

  it('module exported normalized provider', () => {
    @Injectable()
    class Provider1 {}

    @Module({ providersPerReq: [Provider1], exports: [{ provide: Provider1, useClass: Provider1 }] })
    class Module2 {}

    expect(() => mock.scanModule(Module2)).toThrow(`failed: in "exports" array must be includes tokens only`);
  });

  it('module exported invalid extension', () => {
    @Injectable()
    class Extension1 {}

    @Module({ extensions: [{ provide: 'fake token', useClass: Extension1, multi: true }], exports: ['fake token'] })
    class Module2 {}

    expect(() => mock.scanModule(Module2)).toThrow(`must have init() method`);
  });

  it('module exported valid extension', () => {
    @Injectable()
    class Extension1 implements Extension<any> {
      async init() {}
    }

    @Module({ extensions: [{ provide: 'fake token', useClass: Extension1, multi: true }], exports: ['fake token'] })
    class Module2 {}

    expect(() => mock.scanModule(Module2)).not.toThrow();
  });

  it('root module with imported some other modules', () => {
    const fn = () => module4WithParams;
    @Module({ id: '1', imports: [forwardRef(fn)] })
    class Module1 {}

    @Injectable()
    class Provider0 {}

    @Injectable()
    class Provider1 {}

    @Module({
      imports: [Module1],
      providersPerMod: [Provider0],
      providersPerRou: [Provider1],
      exports: [Provider0, Provider1, Module1],
    })
    class Module2 {}

    @Module()
    class Module4 {
      static withParams(providersPerMod: ServiceProvider[]): ModuleWithParams<Module4> {
        return {
          module: Module4,
          providersPerMod,
        };
      }
    }

    @Injectable()
    class Provider2 {}

    const module4WithParams = Module4.withParams([Provider2]);

    @RootModule({
      imports: [Module1, Module2],
      providersPerApp: [],
      extensionsMeta: {},
      controllers: [],
      exports: [],
    })
    class Module3 {}

    const expectedMeta1 = new NormalizedModuleMetadata();
    expectedMeta1.id = '1';
    expectedMeta1.name = 'Module1';
    expectedMeta1.module = Module1;
    expectedMeta1.importsWithParams = [module4WithParams];
    expectedMeta1.ngMetadataName = 'Module';

    mock.scanRootModule(Module3);
    expect(mock.map.size).toBe(4);
    expect(mock.getMetadata('1')).toEqual(expectedMeta1);

    const expectedMeta2 = new NormalizedModuleMetadata();
    expectedMeta2.id = '';
    expectedMeta2.name = 'Module2';
    expectedMeta2.module = Module2;
    expectedMeta2.importsModules = [Module1];
    expectedMeta2.providersPerMod = [Provider0];
    expectedMeta2.providersPerRou = [Provider1];
    expectedMeta2.exportsModules = [Module1];
    expectedMeta2.exportsProvidersPerMod = [Provider0];
    expectedMeta2.exportsProvidersPerRou = [Provider1];
    expectedMeta2.ngMetadataName = 'Module';

    expect(mock.map.get(Module2)).toEqual(expectedMeta2);

    const expectedMeta3 = new NormalizedModuleMetadata();
    expectedMeta3.id = '';
    expectedMeta3.name = 'Module3';
    expectedMeta3.module = Module3;
    expectedMeta3.importsModules = [Module1, Module2];
    expectedMeta3.ngMetadataName = 'RootModule';

    expect(mock.getMetadata('root')).toEqual(expectedMeta3);

    const expectedMeta4 = new NormalizedModuleMetadata();
    expectedMeta4.id = '';
    expectedMeta4.name = 'Module4';
    expectedMeta4.module = module4WithParams;
    expectedMeta4.providersPerMod = [Provider2];
    expectedMeta4.ngMetadataName = 'Module';

    expect(mock.map.get(module4WithParams)).toEqual(expectedMeta4);
  });

  it('programmatically adding some modules to "imports" array of root module', () => {
    @Injectable()
    class Provider1 {}

    @RootModule({
      imports: [],
      providersPerReq: [Provider1],
      extensionsMeta: {},
      controllers: [],
      exports: [],
    })
    class AppModule {}

    @Module()
    class Module1 {}

    @Module()
    class Module2 {}

    @Module()
    class Module3 {
      static withParams(providersPerMod: ServiceProvider[]): ModuleWithParams<Module3> {
        return {
          module: Module3,
          providersPerMod,
        };
      }
    }

    @Module()
    class Module4 {}

    @Injectable()
    class Provider2 {}

    const module3WithProviders = Module3.withParams([Provider2]);

    const expectedMeta1 = new NormalizedModuleMetadata();
    expectedMeta1.id = '';
    expectedMeta1.name = 'AppModule';
    expectedMeta1.module = AppModule;
    expectedMeta1.providersPerReq = [Provider1];
    expectedMeta1.ngMetadataName = 'RootModule';

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(1);
    expect(mock.getMetadata('root')).not.toBe(mock.getMetadata('root'));
    expect(mock.getRawMetadata('root')).toBe(mock.getRawMetadata('root'));
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

    expect(() => mock.addImport(Module2, 'fakeId')).toThrowError(/Failed adding Module2 to imports/);
    expect(mock.map.size).toBe(2);
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.size).toBe(0);

    const expectedMeta2 = new NormalizedModuleMetadata();
    expectedMeta2.id = '';
    expectedMeta2.name = 'AppModule';
    expectedMeta2.module = AppModule;
    expectedMeta2.importsModules = [Module1];
    expectedMeta2.providersPerReq = [Provider1];
    expectedMeta2.ngMetadataName = 'RootModule';

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

    const expectedMeta3 = new NormalizedModuleMetadata();
    expectedMeta3.id = '';
    expectedMeta3.name = 'AppModule';
    expectedMeta3.module = AppModule;
    expectedMeta3.importsModules = [Module1, Module2, Module4];
    expectedMeta3.providersPerReq = [Provider1];
    expectedMeta3.ngMetadataName = 'RootModule';

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
    @Injectable()
    class Provider1 {}

    @Module()
    class Module0 {}

    @Module({ imports: [Module0] })
    class Module1 {}

    @Module({ imports: [Module0] })
    class Module2 {}

    @Module()
    class Module3 {
      static withParams(providersPerMod: ServiceProvider[]): ModuleWithParams<Module3> {
        return {
          module: Module3,
          providersPerMod,
        };
      }
    }

    @Injectable()
    class Provider2 {}

    const module3WithProviders = Module3.withParams([Provider2]);

    const moduleId = 'my-mix';
    @Module()
    class Module4 {
      static withParams(providersPerMod: ServiceProvider[]): ModuleWithParams<Module4> {
        return {
          id: moduleId,
          module: Module4,
          providersPerMod,
        };
      }
    }

    const module4WithProviders = Module4.withParams([Provider2]);

    @RootModule({
      imports: [Module1, Module2, module3WithProviders, module4WithProviders],
      providersPerReq: [Provider1],
      extensionsMeta: {},
      controllers: [],
      exports: [],
    })
    class AppModule {}

    const expectedMeta1 = new NormalizedModuleMetadata();
    expectedMeta1.id = '';
    expectedMeta1.name = 'AppModule';
    expectedMeta1.module = AppModule;
    expectedMeta1.importsModules = [Module1, Module2];
    expectedMeta1.importsWithParams = [module3WithProviders, module4WithProviders];
    expectedMeta1.providersPerReq = [Provider1];
    expectedMeta1.ngMetadataName = 'RootModule';

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(6);
    expect(mock.getMetadata('root')).toEqual(expectedMeta1);
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.size).toBe(0);
    expect(mock.map.get(Module1)).toMatchObject<PartialMeta>({ importsModules: [Module0] });

    expect(mock.removeImport(Module0, Module1)).toBe(true);
    expect(mock.map.get(Module1)).toMatchObject<PartialMeta>({ importsModules: [] });
    expect(mock.map.size).toBe(6);
    expect(mock.map.has(Module0)).toBe(true);
    expect(mock.oldMap.size).toBe(6);
    expect(mock.oldMap.get(Module1)).toMatchObject<PartialMeta>({ importsModules: [Module0] });
    expect(mock.oldMap.has(Module0)).toBe(true);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMapId.has(moduleId)).toBe(true);
    expect(mock.oldMapId.get('root')).toBe(AppModule);

    expect(mock.map.get(Module2)).toMatchObject<PartialMeta>({ importsModules: [Module0] });
    expect(mock.removeImport(Module0, Module2)).toBe(true);
    expect(mock.map.get(Module2)).toMatchObject<PartialMeta>({ importsModules: [] });
    expect(mock.map.size).toBe(5);
    expect(mock.map.has(Module0)).toBe(false);
    expect(mock.oldMap.size).toBe(6);
    expect(mock.oldMap.get(Module2)).toMatchObject<PartialMeta>({ importsModules: [Module0] });
    expect(mock.oldMap.has(Module0)).toBe(true);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMapId.has(moduleId)).toBe(true);
    expect(mock.oldMapId.get('root')).toBe(AppModule);

    mock.commit();
    expect(mock.map.size).toBe(5);
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.size).toBe(0);

    const expectedMeta2 = new NormalizedModuleMetadata();
    expectedMeta2.id = '';
    expectedMeta2.name = 'AppModule';
    expectedMeta2.module = AppModule;
    expectedMeta2.importsModules = [Module1];
    expectedMeta2.importsWithParams = [module3WithProviders, module4WithProviders];
    expectedMeta2.providersPerReq = [Provider1];
    expectedMeta2.ngMetadataName = 'RootModule';

    expect(mock.getMetadata('root')).toMatchObject<PartialMeta>({ importsModules: [Module1, Module2] });
    expect(mock.removeImport(Module2)).toBe(true);
    expect(mock.getMetadata('root')).toMatchObject<PartialMeta>({ importsModules: [Module1] });
    expect(mock.map.size).toBe(4);
    expect(mock.oldMap.get(AppModule)).toMatchObject<PartialMeta>({ importsModules: [Module1, Module2] });
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(5);

    expect(mock.removeImport(Module2)).toBe(false);
    expect(mock.map.size).toBe(4);
    expect(mock.getMetadata('root')).toMatchObject<PartialMeta>({ importsModules: [Module1] });
    expect(mock.getMetadata('root')).toEqual(expectedMeta2);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(5);

    const expectedMeta3 = new NormalizedModuleMetadata();
    expectedMeta3.id = '';
    expectedMeta3.name = 'AppModule';
    expectedMeta3.module = AppModule;
    expectedMeta3.importsModules = [Module1];
    expectedMeta3.importsWithParams = [module4WithProviders];
    expectedMeta3.providersPerReq = [Provider1];
    expectedMeta3.ngMetadataName = 'RootModule';

    expect(mock.getMetadata('root')).toMatchObject<PartialMeta>({
      importsWithParams: [module3WithProviders, module4WithProviders],
    });
    expect(mock.removeImport(module3WithProviders)).toBe(true);
    expect(mock.getMetadata('root')).toMatchObject<PartialMeta>({ importsWithParams: [module4WithProviders] });
    expect(mock.map.size).toBe(3);
    expect(mock.getMetadata('root')).toEqual(expectedMeta3);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(5);
    expect(mock.oldMap.get(AppModule)).toMatchObject<PartialMeta>({
      importsWithParams: [module3WithProviders, module4WithProviders],
    });

    const expectedMeta4 = new NormalizedModuleMetadata();
    expectedMeta4.id = '';
    expectedMeta4.name = 'AppModule';
    expectedMeta4.module = AppModule;
    expectedMeta4.importsModules = [Module1];
    expectedMeta4.providersPerReq = [Provider1];
    expectedMeta4.ngMetadataName = 'RootModule';

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
    @Injectable()
    class Extension1 implements Extension<void> {
      async init() {}
    }

    const GROUP_EXTENSIONS = new InjectionToken<Extension<void>[]>('GROUP_EXTENSIONS');
    const extensions: ExtensionsProvider[] = [
      Extension1,
      { provide: GROUP_EXTENSIONS, useExisting: Extension1, multi: true },
    ];

    @Module({
      extensions,
      exports: [Extension1, GROUP_EXTENSIONS],
    })
    class Module1 {}

    @RootModule({
      imports: [Module1],
    })
    class Module3 {}

    const expectedMeta3 = new NormalizedModuleMetadata();
    expectedMeta3.id = '';
    expectedMeta3.name = 'Module3';
    expectedMeta3.module = Module3;
    expectedMeta3.importsModules = [Module1];
    expectedMeta3.ngMetadataName = 'RootModule';

    const expectedMeta1 = new NormalizedModuleMetadata();
    expectedMeta1.id = '';
    expectedMeta1.name = 'Module1';
    expectedMeta1.module = Module1;
    expectedMeta1.extensions = extensions;
    expectedMeta1.exportsExtensions = extensions;
    expectedMeta1.ngMetadataName = 'Module';

    mock.scanRootModule(Module3);
    expect(mock.getMetadata('root')).toEqual(expectedMeta3);
    expect(mock.getMetadata(Module1)).toEqual(expectedMeta1);
  });

  it('root module with exported globaly some extension', () => {
    @Injectable()
    class Extension1 implements Extension<void> {
      async init() {}
    }

    const GROUP_EXTENSIONS = new InjectionToken<Extension<void>[]>('GROUP_EXTENSIONS');
    const extensions: ExtensionsProvider[] = [
      Extension1,
      { provide: GROUP_EXTENSIONS, useExisting: Extension1, multi: true },
    ];

    @Module({
      extensions,
      exports: [Extension1, GROUP_EXTENSIONS],
    })
    class Module1 {}

    @RootModule({
      imports: [Module1],
      exports: [Module1],
    })
    class Module3 {}

    const expectedMeta3 = new NormalizedModuleMetadata();
    expectedMeta3.id = '';
    expectedMeta3.name = 'Module3';
    expectedMeta3.module = Module3;
    expectedMeta3.importsModules = [Module1];
    expectedMeta3.exportsModules = [Module1];
    expectedMeta3.ngMetadataName = 'RootModule';

    const expectedMeta1 = new NormalizedModuleMetadata();
    expectedMeta1.id = '';
    expectedMeta1.name = 'Module1';
    expectedMeta1.module = Module1;
    expectedMeta1.extensions = extensions;
    expectedMeta1.exportsExtensions = extensions;
    expectedMeta1.ngMetadataName = 'Module';

    mock.scanRootModule(Module3);
    expect(mock.getMetadata('root')).toEqual(expectedMeta3);
    expect(mock.getMetadata(Module1)).toEqual(expectedMeta1);
  });
});
