import 'reflect-metadata';
import * as http from 'http';
import { Injectable, forwardRef } from '@ts-stack/di';

import { RootModule } from '../decorators/root-module';
import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { ModuleManager } from './module-manager';
import { Module } from '../decorators/module';
import { ModuleWithParams, ServiceProvider, ModuleType, AnyObj } from '../types/mix';
import { LoggerConfig } from '../types/logger';
import { DefaultLogger } from './default-logger';
import { Log } from './log';
import { LogManager } from './log-manager';

describe('ModuleManager', () => {
  type ModuleId = string | ModuleType | ModuleWithParams;

  class MockModuleManager extends ModuleManager {
    override map = new Map<ModuleType | ModuleWithParams, NormalizedModuleMetadata>();
    override mapId = new Map<string, ModuleType | ModuleWithParams>();
    override oldMap = new Map<ModuleType | ModuleWithParams, NormalizedModuleMetadata>();
    override oldMapId = new Map<string, ModuleType | ModuleWithParams>();

    override getRawMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(moduleId: ModuleId, throwErrOnNotFound?: boolean) {
      return super.getRawMetadata<T, A>(moduleId, throwErrOnNotFound);
    }
  }

  let mock: MockModuleManager;

  beforeEach(() => {
    const config = new LoggerConfig();
    const logger = new DefaultLogger(config);
    const logManager = new LogManager();
    const log = new Log(logManager, logger);
    mock = new MockModuleManager(log);
  });

  it('empty root module', () => {
    @RootModule()
    class AppModule {}

    const expectedMetadata: NormalizedModuleMetadata = {
      id: '',
      name: 'AppModule',
      exportsModules: [],
      exportsWithParams: [],
      exportsProvidersPerMod: [],
      exportsProvidersPerRou: [],
      exportsProvidersPerReq: [],
      importsModules: [],
      importsWithParams: [],
      providersPerApp: [],
      providersPerMod: [],
      providersPerRou: [],
      providersPerReq: [],
      extensions: [],
      controllers: [],
      extensionsMeta: {},
      module: AppModule,
      ngMetadataName: 'RootModule',
    };

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(1);
    expect(mock.getMetadata('root')).toMatchObject(expectedMetadata);
  });

  it('non properly exports from root module', () => {
    class Provider1 {}

    @RootModule({
      exports: [Provider1]
    })
    class AppModule {}

    expect(() => mock.scanRootModule(AppModule)).toThrowError(/Importing Provider1 from AppModule should includes in/);
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

    const expectedMetadata: NormalizedModuleMetadata = {
      id: '',
      name: 'AppModule',
      exportsModules: [],
      exportsWithParams: [],
      exportsProvidersPerMod: [],
      exportsProvidersPerRou: [],
      exportsProvidersPerReq: [],
      importsModules: [],
      importsWithParams: [],
      providersPerApp: [],
      providersPerMod: [],
      extensions: [],
      extensionsMeta: {},
      controllers: [],
      module: AppModule,
      providersPerRou: [],
      providersPerReq: [Provider1],
      ngMetadataName: 'RootModule',
    };

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(1);
    expect(mock.getMetadata('root')).toMatchObject(expectedMetadata);
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

    const module1Expect: NormalizedModuleMetadata = {
      name: 'Module1',
      exportsModules: [],
      exportsWithParams: [],
      exportsProvidersPerMod: [],
      exportsProvidersPerRou: [],
      exportsProvidersPerReq: [],
      importsModules: [],
      providersPerApp: [],
      providersPerMod: [],
      providersPerRou: [],
      providersPerReq: [],
      extensions: [],
      extensionsMeta: {},
      controllers: [],
      module: Module1,
      id: '1',
      importsWithParams: [module4WithParams],
      ngMetadataName: 'Module',
    };

    mock.scanRootModule(Module3);
    expect(mock.map.size).toBe(4);
    expect(mock.getMetadata('1')).toMatchObject(module1Expect);

    const module2Expect: NormalizedModuleMetadata = {
      id: '',
      name: 'Module2',
      module: Module2,
      ngMetadataName: 'Module',
      importsModules: [Module1],
      providersPerApp: [],
      providersPerMod: [Provider0],
      providersPerRou: [Provider1],
      providersPerReq: [],
      extensions: [],
      extensionsMeta: {},
      controllers: [],
      importsWithParams: [],
      exportsModules: [Module1],
      exportsWithParams: [],
      exportsProvidersPerMod: [Provider0],
      exportsProvidersPerRou: [Provider1],
      exportsProvidersPerReq: []
    };

    expect(mock.map.get(Module2)).toMatchObject(module2Expect);

    const module3Expect: NormalizedModuleMetadata = {
      id: '',
      name: 'Module3',
      exportsModules: [],
      exportsWithParams: [],
      exportsProvidersPerMod: [],
      exportsProvidersPerRou: [],
      exportsProvidersPerReq: [],
      providersPerApp: [],
      providersPerMod: [],
      providersPerRou: [],
      providersPerReq: [],
      extensions: [],
      extensionsMeta: {},
      controllers: [],
      importsWithParams: [],
      module: Module3,
      importsModules: [Module1, Module2],
      ngMetadataName: 'RootModule',
    };

    expect(mock.getMetadata('root')).toMatchObject(module3Expect);

    const module4Expect: NormalizedModuleMetadata = {
      id: '',
      name: 'Module4',
      exportsModules: [],
      exportsWithParams: [],
      exportsProvidersPerMod: [],
      exportsProvidersPerRou: [],
      exportsProvidersPerReq: [],
      importsModules: [],
      importsWithParams: [],
      providersPerApp: [],
      providersPerRou: [],
      providersPerReq: [],
      extensions: [],
      extensionsMeta: {},
      controllers: [],
      module: module4WithParams,
      providersPerMod: [Provider2],
      ngMetadataName: 'Module',
    };

    expect(mock.map.get(module4WithParams)).toMatchObject(module4Expect);
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

    const expectedMetadata1: NormalizedModuleMetadata = {
      id: '',
      name: 'AppModule',
      providersPerApp: [],
      providersPerMod: [],
      providersPerRou: [],
      extensions: [],
      extensionsMeta: {},
      controllers: [],
      exportsModules: [],
      exportsWithParams: [],
      exportsProvidersPerMod: [],
      exportsProvidersPerRou: [],
      exportsProvidersPerReq: [],
      importsModules: [],
      importsWithParams: [],
      module: AppModule,
      providersPerReq: [Provider1],
      ngMetadataName: 'RootModule',
    };

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(1);
    expect(mock.getMetadata('root') === mock.getMetadata('root')).toBe(false);
    expect(mock.getRawMetadata('root') === mock.getRawMetadata('root')).toBe(true);
    expect(mock.getMetadata('root')).toMatchObject(expectedMetadata1);

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

    const expectedOldMetadata1: NormalizedModuleMetadata = {
      id: '',
      name: 'AppModule',
      providersPerApp: [],
      providersPerMod: [],
      providersPerRou: [],
      extensions: [],
      extensionsMeta: {},
      controllers: [],
      exportsModules: [],
      exportsWithParams: [],
      exportsProvidersPerMod: [],
      exportsProvidersPerRou: [],
      exportsProvidersPerReq: [],
      importsModules: [],
      importsWithParams: [],
      module: AppModule,
      providersPerReq: [Provider1],
      ngMetadataName: 'RootModule',
    };

    expect(mock.addImport(Module1)).toBe(true);
    expect(mock.map.size).toBe(2);
    expect(mock.oldMapId.size).toBe(1);
    expect(mock.oldMapId.get('root')).toBe(AppModule);
    expect(mock.oldMap.size).toBe(1);
    expect(mock.oldMap.has(AppModule)).toBe(true);
    expect(mock.oldMap.get(AppModule)).toMatchObject(expectedOldMetadata1);

    expect(mock.addImport(Module1)).toBe(false);
    expect(mock.oldMap.size).toBe(1);
    expect(mock.oldMap.has(AppModule)).toBe(true);
    expect(mock.oldMap.get(AppModule)).toMatchObject(expectedOldMetadata1);
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

    const expectedOldMetadata2: NormalizedModuleMetadata = {
      id: '',
      name: 'AppModule',
      providersPerApp: [],
      providersPerMod: [],
      providersPerRou: [],
      extensions: [],
      extensionsMeta: {},
      controllers: [],
      exportsModules: [],
      exportsWithParams: [],
      exportsProvidersPerMod: [],
      exportsProvidersPerRou: [],
      exportsProvidersPerReq: [],
      importsModules: [Module1],
      importsWithParams: [],
      module: AppModule,
      providersPerReq: [Provider1],
      ngMetadataName: 'RootModule',
    };

    mock.addImport(Module2);
    expect(mock.map.size).toBe(3);
    expect(mock.oldMap.size).toBe(2);
    expect(mock.oldMap.has(AppModule)).toBe(true);
    expect(mock.oldMap.has(Module1)).toBe(true);
    expect(mock.oldMapId.size).toBe(1);
    expect(mock.oldMapId.get('root')).toBe(AppModule);
    expect(mock.oldMap.get(AppModule)).toMatchObject(expectedOldMetadata2);

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
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.has(AppModule)).toBe(false);

    const expectedMetadata2: NormalizedModuleMetadata = {
      id: '',
      name: 'AppModule',
      importsWithParams: [],
      exportsModules: [],
      exportsWithParams: [],
      exportsProvidersPerMod: [],
      exportsProvidersPerRou: [],
      exportsProvidersPerReq: [],
      module: AppModule,
      importsModules: [Module1, Module2, Module4],
      providersPerApp: [],
      providersPerMod: [],
      providersPerRou: [],
      providersPerReq: [Provider1],
      extensions: [],
      extensionsMeta: {},
      controllers: [],
      ngMetadataName: 'RootModule',
    };
    expect(mock.getMetadata('root') === mock.getMetadata('root')).toBe(false);
    expect(mock.getMetadata('root')).toMatchObject(expectedMetadata2);

    const expectedMetadata3: NormalizedModuleMetadata = {
      id: '',
      name: 'AppModule',
      exportsModules: [],
      exportsWithParams: [],
      exportsProvidersPerMod: [],
      exportsProvidersPerRou: [],
      exportsProvidersPerReq: [],
      module: AppModule,
      importsModules: [Module1, Module2, Module4],
      importsWithParams: [module3WithProviders],
      providersPerApp: [],
      providersPerMod: [],
      providersPerRou: [],
      providersPerReq: [Provider1],
      extensions: [],
      extensionsMeta: {},
      controllers: [],
      ngMetadataName: 'RootModule',
    };

    mock.addImport(module3WithProviders);
    expect(mock.map.size).toBe(5);
    expect(mock.oldMap.size).toBe(4);
    expect(mock.getMetadata('root')).toMatchObject(expectedMetadata3);
    expect(mock.map.has(module3WithProviders)).toBe(true);

    mock.rollback();
    expect(mock.map.size).toBe(4);
    expect(mock.map.get(AppModule)).toMatchObject(expectedMetadata2);
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

    const expectedMetadata1: NormalizedModuleMetadata = {
      id: '',
      name: 'AppModule',
      exportsModules: [],
      exportsWithParams: [],
      exportsProvidersPerMod: [],
      exportsProvidersPerRou: [],
      exportsProvidersPerReq: [],
      module: AppModule,
      importsModules: [Module1, Module2],
      importsWithParams: [module3WithProviders, module4WithProviders],
      providersPerApp: [],
      providersPerMod: [],
      providersPerRou: [],
      providersPerReq: [Provider1],
      extensions: [],
      extensionsMeta: {},
      controllers: [],
      ngMetadataName: 'RootModule',
    };

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(6);
    expect(mock.getMetadata('root')).toMatchObject(expectedMetadata1);
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.size).toBe(0);

    expect(mock.removeImport(Module0, Module1)).toBe(true);
    expect(mock.map.size).toBe(6);
    expect(mock.map.has(Module0)).toBe(true);
    expect(mock.oldMap.size).toBe(6);
    expect(mock.oldMap.has(Module0)).toBe(true);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMapId.has(moduleId)).toBe(true);
    expect(mock.oldMapId.get('root')).toBe(AppModule);

    expect(mock.removeImport(Module0, Module2)).toBe(true);
    expect(mock.map.size).toBe(5);
    expect(mock.map.has(Module0)).toBe(false);
    expect(mock.oldMap.size).toBe(6);
    expect(mock.oldMap.has(Module0)).toBe(true);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMapId.has(moduleId)).toBe(true);
    expect(mock.oldMapId.get('root')).toBe(AppModule);

    mock.commit();
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.size).toBe(0);

    const expectedMetadata2: NormalizedModuleMetadata = {
      id: '',
      name: 'AppModule',
      exportsModules: [],
      exportsWithParams: [],
      exportsProvidersPerMod: [],
      exportsProvidersPerRou: [],
      exportsProvidersPerReq: [],
      module: AppModule,
      importsModules: [Module1],
      importsWithParams: [module3WithProviders, module4WithProviders],
      providersPerApp: [],
      providersPerMod: [],
      providersPerRou: [],
      providersPerReq: [Provider1],
      extensions: [],
      extensionsMeta: {},
      controllers: [],
      ngMetadataName: 'RootModule',
    };

    expect(mock.removeImport(Module2)).toBe(true);
    expect(mock.map.size).toBe(4);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(5);

    expect(mock.removeImport(Module2)).toBe(false);
    expect(mock.map.size).toBe(4);
    expect(mock.getMetadata('root')).toMatchObject(expectedMetadata2);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(5);

    const expectedMetadata3: NormalizedModuleMetadata = {
      id: '',
      name: 'AppModule',
      exportsModules: [],
      exportsWithParams: [],
      exportsProvidersPerMod: [],
      exportsProvidersPerRou: [],
      exportsProvidersPerReq: [],
      module: AppModule,
      importsModules: [Module1],
      importsWithParams: [module4WithProviders],
      providersPerApp: [],
      providersPerMod: [],
      providersPerRou: [],
      providersPerReq: [Provider1],
      extensions: [],
      extensionsMeta: {},
      controllers: [],
      ngMetadataName: 'RootModule',
    };

    expect(mock.removeImport(module3WithProviders)).toBe(true);
    expect(mock.map.size).toBe(3);
    expect(mock.getMetadata('root')).toMatchObject(expectedMetadata3);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(5);

    const expectedMetadata4: NormalizedModuleMetadata = {
      id: '',
      name: 'AppModule',
      exportsModules: [],
      exportsWithParams: [],
      exportsProvidersPerMod: [],
      exportsProvidersPerRou: [],
      exportsProvidersPerReq: [],
      module: AppModule,
      importsModules: [Module1],
      importsWithParams: [],
      providersPerApp: [],
      providersPerMod: [],
      providersPerRou: [],
      providersPerReq: [Provider1],
      extensions: [],
      extensionsMeta: {},
      controllers: [],
      ngMetadataName: 'RootModule',
    };

    expect(mock.removeImport(moduleId)).toBe(true);
    expect(mock.map.size).toBe(2);
    expect(mock.getMetadata('root')).toMatchObject(expectedMetadata4);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(5);

    mock.rollback();
    expect(mock.mapId.size).toBe(2);
    expect(mock.map.size).toBe(5);
    expect(mock.getMetadata('root')).toMatchObject(expectedMetadata1);
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.size).toBe(0);
  });
});
