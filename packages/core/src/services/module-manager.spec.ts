import 'reflect-metadata';
import * as http from 'http';
import { Injectable, forwardRef } from '@ts-stack/di';

import { RootModule } from '../decorators/root-module';
import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { ModuleManager } from './module-manager';
import { Module } from '../decorators/module';
import { ModuleWithParams, ServiceProvider, ModuleType } from '../types/mix';
import { LoggerConfig } from '../types/logger';
import { DefaultLogger } from './default-logger';

describe('ModuleManager', () => {
  class MockModuleManager extends ModuleManager {
    map = new Map<ModuleType | ModuleWithParams, NormalizedModuleMetadata>();
    mapId = new Map<string, ModuleType | ModuleWithParams>();
    oldMap = new Map<ModuleType | ModuleWithParams, NormalizedModuleMetadata>();
    oldMapId = new Map<string, ModuleType | ModuleWithParams>();
  }

  let mock: MockModuleManager;

  beforeEach(() => {
    const config = new LoggerConfig();
    config.level = 'error';
    const log = new DefaultLogger(config);
    mock = new MockModuleManager(log);
  });

  it('empty root module', () => {
    @RootModule()
    class AppModule {}

    const expectedMetadata: NormalizedModuleMetadata = {
      id: '',
      name: 'AppModule',
      exportsModules: [],
      exportsProviders: [],
      importsModules: [],
      importsWithParams: [],
      providersPerApp: [],
      providersPerMod: [],
      providersPerReq: [],
      extensions: [],
      controllers: [],
      module: AppModule,
      ngMetadataName: 'RootModule',
    };

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(1);
    expect(mock.getMetadata('root')).toEqual(expectedMetadata);
    expect(Object.isFrozen(AppModule)).toBe(true);
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
      providersPerReq: [Provider1],
      controllers: [],
      exports: [],
    })
    class AppModule {}

    const expectedMetadata: NormalizedModuleMetadata = {
      id: '',
      name: 'AppModule',
      exportsModules: [],
      exportsProviders: [],
      importsModules: [],
      importsWithParams: [],
      providersPerApp: [],
      providersPerMod: [],
      extensions: [],
      controllers: [],
      module: AppModule,
      providersPerReq: [Provider1],
      ngMetadataName: 'RootModule',
    };

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(1);
    expect(mock.getMetadata('root')).toEqual(expectedMetadata);
  });

  it('root module with imported some other modules', () => {
    const fn = () => module4WithParams;
    @Module({ id: '1', imports: [forwardRef(fn)] })
    class Module1 {}

    @Injectable()
    class Provider1 {}

    @Module({
      imports: [Module1],
      providersPerMod: [Provider1],
      exports: [Provider1, Module1],
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
      controllers: [],
      exports: [],
    })
    class Module3 {}

    const module1Expect: NormalizedModuleMetadata = {
      name: 'Module1',
      exportsModules: [],
      exportsProviders: [],
      importsModules: [],
      providersPerApp: [],
      providersPerMod: [],
      providersPerReq: [],
      extensions: [],
      controllers: [],
      module: Module1,
      id: '1',
      importsWithParams: [module4WithParams],
      ngMetadataName: 'Module',
    };

    mock.scanRootModule(Module3);
    expect(mock.map.size).toBe(4);
    expect(mock.getMetadata('1')).toEqual(module1Expect);
    expect(Object.isFrozen(module4WithParams)).toBe(true);

    const module2Expect: NormalizedModuleMetadata = {
      id: '',
      name: 'Module2',
      module: Module2,
      ngMetadataName: 'Module',
      importsModules: [Module1],
      providersPerApp: [],
      providersPerReq: [],
      extensions: [],
      controllers: [],
      importsWithParams: [],
      exportsModules: [Module1],
      exportsProviders: [Provider1],
      providersPerMod: [Provider1],
    };

    expect(mock.map.get(Module2)).toEqual(module2Expect);

    const module3Expect: NormalizedModuleMetadata = {
      id: '',
      name: 'Module3',
      exportsModules: [],
      exportsProviders: [],
      providersPerApp: [],
      providersPerMod: [],
      providersPerReq: [],
      extensions: [],
      controllers: [],
      importsWithParams: [],
      module: Module3,
      importsModules: [Module1, Module2],
      ngMetadataName: 'RootModule',
    };

    expect(mock.getMetadata('root')).toEqual(module3Expect);

    const module4Expect: NormalizedModuleMetadata = {
      id: '',
      name: 'Module4',
      exportsModules: [],
      exportsProviders: [],
      importsModules: [],
      importsWithParams: [],
      providersPerApp: [],
      providersPerReq: [],
      extensions: [],
      controllers: [],
      module: module4WithParams,
      providersPerMod: [Provider2],
      ngMetadataName: 'Module',
    };

    expect(mock.map.get(module4WithParams)).toEqual(module4Expect);
  });

  it('programmatically adding some modules to "imports" array of root module', () => {
    @Injectable()
    class Provider1 {}

    @RootModule({
      imports: [],
      providersPerReq: [Provider1],
      controllers: [],
      exports: [],
    })
    class AppModule {}

    const expectedMetadata1: NormalizedModuleMetadata = {
      id: '',
      name: 'AppModule',
      providersPerApp: [],
      providersPerMod: [],
      extensions: [],
      controllers: [],
      exportsModules: [],
      exportsProviders: [],
      importsModules: [],
      importsWithParams: [],
      module: AppModule,
      providersPerReq: [Provider1],
      ngMetadataName: 'RootModule',
    };

    mock.scanRootModule(AppModule);
    const meta = mock.getMetadata('root');
    expect(mock.map.size).toBe(1);
    expect(mock.getMetadata('root') === mock.getMetadata('root')).toBe(true);
    expect(meta).toEqual(expectedMetadata1);

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
      extensions: [],
      controllers: [],
      exportsModules: [],
      exportsProviders: [],
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
    expect(mock.oldMap.get(AppModule)).toEqual(expectedOldMetadata1);

    expect(mock.addImport(Module1)).toBe(false);
    expect(mock.oldMap.size).toBe(1);
    expect(mock.oldMap.has(AppModule)).toBe(true);
    expect(mock.oldMap.get(AppModule)).toEqual(expectedOldMetadata1);
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
      extensions: [],
      controllers: [],
      exportsModules: [],
      exportsProviders: [],
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
    expect(mock.oldMap.get(AppModule)).toEqual(expectedOldMetadata2);

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
      exportsProviders: [],
      module: AppModule,
      importsModules: [Module1, Module2, Module4],
      providersPerReq: [Provider1],
      providersPerApp: [],
      providersPerMod: [],
      extensions: [],
      controllers: [],
      ngMetadataName: 'RootModule',
    };
    expect(meta === mock.getMetadata('root')).toBe(true);
    expect(meta).toEqual(expectedMetadata2);

    const expectedMetadata3: NormalizedModuleMetadata = {
      id: '',
      name: 'AppModule',
      exportsModules: [],
      exportsProviders: [],
      module: AppModule,
      importsModules: [Module1, Module2, Module4],
      importsWithParams: [module3WithProviders],
      providersPerReq: [Provider1],
      providersPerApp: [],
      providersPerMod: [],
      extensions: [],
      controllers: [],
      ngMetadataName: 'RootModule',
    };

    mock.addImport(module3WithProviders);
    expect(mock.map.size).toBe(5);
    expect(mock.oldMap.size).toBe(4);
    expect(meta).toEqual(expectedMetadata3);
    expect(mock.map.has(module3WithProviders)).toBe(true);

    mock.rollback();
    expect(mock.map.size).toBe(4);
    expect(mock.map.get(AppModule)).toEqual(expectedMetadata2);
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
      controllers: [],
      exports: [],
    })
    class AppModule {}

    const expectedMetadata1: NormalizedModuleMetadata = {
      id: '',
      name: 'AppModule',
      exportsModules: [],
      exportsProviders: [],
      module: AppModule,
      importsModules: [Module1, Module2],
      importsWithParams: [module3WithProviders, module4WithProviders],
      providersPerApp: [],
      providersPerMod: [],
      extensions: [],
      controllers: [],
      providersPerReq: [Provider1],
      ngMetadataName: 'RootModule',
    };

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(6);
    expect(mock.getMetadata('root')).toEqual(expectedMetadata1);
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
      exportsProviders: [],
      module: AppModule,
      importsModules: [Module1],
      importsWithParams: [module3WithProviders, module4WithProviders],
      providersPerReq: [Provider1],
      providersPerApp: [],
      providersPerMod: [],
      extensions: [],
      controllers: [],
      ngMetadataName: 'RootModule',
    };

    expect(mock.removeImport(Module2)).toBe(true);
    expect(mock.map.size).toBe(4);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(5);

    expect(mock.removeImport(Module2)).toBe(false);
    expect(mock.map.size).toBe(4);
    expect(mock.getMetadata('root')).toEqual(expectedMetadata2);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(5);

    const expectedMetadata3: NormalizedModuleMetadata = {
      id: '',
      name: 'AppModule',
      exportsModules: [],
      exportsProviders: [],
      module: AppModule,
      importsModules: [Module1],
      importsWithParams: [module4WithProviders],
      providersPerReq: [Provider1],
      providersPerApp: [],
      providersPerMod: [],
      extensions: [],
      controllers: [],
      ngMetadataName: 'RootModule',
    };

    expect(mock.removeImport(module3WithProviders)).toBe(true);
    expect(mock.map.size).toBe(3);
    expect(mock.getMetadata('root')).toEqual(expectedMetadata3);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(5);

    const expectedMetadata4: NormalizedModuleMetadata = {
      id: '',
      name: 'AppModule',
      exportsModules: [],
      exportsProviders: [],
      module: AppModule,
      importsModules: [Module1],
      importsWithParams: [],
      providersPerReq: [Provider1],
      providersPerApp: [],
      providersPerMod: [],
      extensions: [],
      controllers: [],
      ngMetadataName: 'RootModule',
    };

    expect(mock.removeImport(moduleId)).toBe(true);
    expect(mock.map.size).toBe(2);
    expect(mock.getMetadata('root')).toEqual(expectedMetadata4);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(5);

    mock.rollback();
    expect(mock.mapId.size).toBe(2);
    expect(mock.map.size).toBe(5);
    expect(mock.getMetadata('root')).toEqual(expectedMetadata1);
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.size).toBe(0);
  });
});
