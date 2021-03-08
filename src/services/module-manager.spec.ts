import 'reflect-metadata';
import * as http from 'http';
import { Injectable, forwardRef } from '@ts-stack/di';

import { RootModule } from '../decorators/root-module';
import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { ModuleManager } from './module-manager';
import { Module } from '../decorators/module';
import { ModuleWithParams } from '../types/module-with-params';
import { ServiceProvider } from '../types/service-provider';
import { LoggerConfig } from '../types/logger';
import { DefaultLogger } from './default-logger';
import { ModuleType } from '../types/module-type';

describe('ModuleManager', () => {
  class MockModuleManager extends ModuleManager {
    map = new Map<ModuleType | ModuleWithParams, NormalizedModuleMetadata>();
    mapId = new Map<string, ModuleType | ModuleWithParams>();

    getMaps() {
      return { map: this.map, mapId: this.mapId };
    }
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
    const { map } = mock.getMaps();
    expect(map.size).toBe(1);
    expect(mock.getMetadata('root')).toEqual(expectedMetadata);
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
    const { map } = mock.getMaps();
    expect(map.size).toBe(1);
    expect(mock.getMetadata('root')).toEqual(expectedMetadata);
  });

  it('root module with imported some other modules', () => {
    const fn = () => module4WithProviders;
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

    const module4WithProviders = Module4.withParams([Provider2]);

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
      importsWithParams: [module4WithProviders],
      ngMetadataName: 'Module',
    };

    const module2Expect: NormalizedModuleMetadata = {
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

    const module3Expect: NormalizedModuleMetadata = {
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

    const module4Expect: NormalizedModuleMetadata = {
      name: 'Module4',
      exportsModules: [],
      exportsProviders: [],
      importsModules: [],
      importsWithParams: [],
      providersPerApp: [],
      providersPerReq: [],
      extensions: [],
      controllers: [],
      module: module4WithProviders,
      providersPerMod: [Provider2],
      ngMetadataName: 'Module',
    };

    mock.scanRootModule(Module3);
    const { map } = mock.getMaps();
    expect(map.size).toBe(4);
    expect(mock.getMetadata('1')).toEqual(module1Expect);
    expect(map.get(Module2)).toEqual(module2Expect);
    expect(mock.getMetadata('root')).toEqual(module3Expect);
    expect(map.get(module4WithProviders)).toEqual(module4Expect);
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
    const { map } = mock.getMaps();
    const rootMetadata = mock.getMetadata('root');
    expect(map.size).toBe(1);
    expect(mock.getMetadata('root') === mock.getMetadata('root')).toBe(true);
    expect(rootMetadata).toEqual(expectedMetadata1);

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

    @Injectable()
    class Provider2 {}

    const module3WithProviders = Module3.withParams([Provider2]);

    expect(mock.addImport(Module1)).toBe(true);
    expect(map.size).toBe(2);
    expect(mock.addImport(Module1)).toBe(false);
    expect(map.size).toBe(2);
    expect(() => mock.addImport(Module2, 'fakeId')).toThrowError(/Failed adding Module2 to "imports" array/);
    expect(map.size).toBe(2);
    mock.addImport(Module2);
    expect(map.size).toBe(3);

    const expectedMetadata2: NormalizedModuleMetadata = {
      name: 'AppModule',
      importsWithParams: [],
      exportsModules: [],
      exportsProviders: [],
      module: AppModule,
      importsModules: [Module1, Module2],
      providersPerReq: [Provider1],
      providersPerApp: [],
      providersPerMod: [],
      extensions: [],
      controllers: [],
      ngMetadataName: 'RootModule',
    };
    expect(map === mock.getMaps().map).toBe(true);
    expect(rootMetadata === mock.getMetadata('root')).toBe(true);
    expect(rootMetadata).toEqual(expectedMetadata2);

    const expectedMetadata3: NormalizedModuleMetadata = {
      name: 'AppModule',
      exportsModules: [],
      exportsProviders: [],
      module: AppModule,
      importsModules: [Module1, Module2],
      importsWithParams: [module3WithProviders],
      providersPerReq: [Provider1],
      providersPerApp: [],
      providersPerMod: [],
      extensions: [],
      controllers: [],
      ngMetadataName: 'RootModule',
    };
    mock.addImport(module3WithProviders);
    expect(map.size).toBe(4);
    expect(rootMetadata).toEqual(expectedMetadata3);
  });

  it('programmatically removing some modules from "imports" array of root module', () => {
    @Injectable()
    class Provider1 {}

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

    @Injectable()
    class Provider2 {}

    const module3WithProviders = Module3.withParams([Provider2]);

    const moduleId = 'my-module-with-params';
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

    const expectedMetadata2: NormalizedModuleMetadata = {
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

    const expectedMetadata3: NormalizedModuleMetadata = {
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

    const expectedMetadata4: NormalizedModuleMetadata = {
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

    mock.scanRootModule(AppModule);
    const { map } = mock.getMaps();
    expect(map.size).toBe(5);
    expect(mock.getMetadata('root')).toEqual(expectedMetadata1);

    expect(mock.removeImport(Module2)).toBe(true);
    expect(map.size).toBe(4);
    expect(mock.removeImport(Module2)).toBe(false);
    expect(map.size).toBe(4);
    expect(mock.getMetadata('root')).toEqual(expectedMetadata2);

    expect(mock.removeImport(module3WithProviders)).toBe(true);
    expect(map.size).toBe(3);
    expect(mock.getMetadata('root')).toEqual(expectedMetadata3);

    expect(mock.removeImport(moduleId)).toBe(true);
    expect(map.size).toBe(2);
    expect(mock.getMetadata('root')).toEqual(expectedMetadata4);
  });
});
