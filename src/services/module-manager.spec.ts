import 'reflect-metadata';
import * as http from 'http';
import { Injectable, forwardRef } from '@ts-stack/di';

import { RootModule } from '../decorators/root-module';
import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { ModuleManager } from './module-manager';
import { Module } from '../decorators/module';
import { ModuleWithParams } from '../types/module-with-params';
import { ServiceProvider } from '../types/service-provider';

describe('ModuleManager', () => {
  class MockModuleManager extends ModuleManager {}

  let mock: MockModuleManager;

  beforeEach(() => {
    mock = new MockModuleManager();
  });

  it('empty root module', () => {
    @RootModule()
    class AppModule {}

    const expectedMetadata: NormalizedModuleMetadata = {
      module: AppModule,
      ngMetadataName: 'RootModule',
    };

    mock.scanRootModule(AppModule);
    const map = mock.getModules();
    expect(map.size).toBe(1);
    expect(map.get('root')).toEqual(expectedMetadata);
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
      module: AppModule,
      providersPerReq: [Provider1],
      ngMetadataName: 'RootModule',
    };

    mock.scanRootModule(AppModule);
    const map = mock.getModules();
    expect(map.size).toBe(1);
    expect(map.get('root')).toEqual(expectedMetadata);
  });

  it('root module with imported some other modules', () => {
    const fn = () => module4WithProviders;
    @Module({ id: 1, imports: [forwardRef(fn)] })
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
      module: Module1,
      id: 1,
      importsWithParams: [module4WithProviders],
      ngMetadataName: 'Module',
    };

    const module2Expect: NormalizedModuleMetadata = {
      module: Module2,
      ngMetadataName: 'Module',
      importsModules: [Module1],
      exportsModules: [Module1],
      exportsProviders: [Provider1],
      providersPerMod: [Provider1],
    };

    const module3Expect: NormalizedModuleMetadata = {
      module: Module3,
      importsModules: [Module1, Module2],
      ngMetadataName: 'RootModule',
    };

    const module4Expect: NormalizedModuleMetadata = {
      module: module4WithProviders,
      providersPerMod: [Provider2],
      ngMetadataName: 'Module',
    };

    mock.scanRootModule(Module3);
    const map = mock.getModules();
    expect(map.size).toBe(4);
    expect(map.get(1)).toEqual(module1Expect);
    expect(map.get(Module2)).toEqual(module2Expect);
    expect(map.get('root')).toEqual(module3Expect);
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
      module: AppModule,
      providersPerReq: [Provider1],
      ngMetadataName: 'RootModule',
    };

    mock.scanRootModule(AppModule);
    const map = mock.getModules();
    const rootMetadata = map.get('root');
    expect(map.size).toBe(1);
    expect(map.get('root') === map.get('root')).toBe(true);
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
      module: AppModule,
      importsModules: [Module1, Module2],
      providersPerReq: [Provider1],
      ngMetadataName: 'RootModule',
    };
    expect(map === mock.getModules()).toBe(true);
    expect(rootMetadata === map.get('root')).toBe(true);
    expect(rootMetadata).toEqual(expectedMetadata2);
    
    const expectedMetadata3: NormalizedModuleMetadata = {
      module: AppModule,
      importsModules: [Module1, Module2],
      importsWithParams: [module3WithProviders],
      providersPerReq: [Provider1],
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
      module: AppModule,
      importsModules: [Module1, Module2],
      importsWithParams: [module3WithProviders, module4WithProviders],
      providersPerReq: [Provider1],
      ngMetadataName: 'RootModule',
    };

    const expectedMetadata2: NormalizedModuleMetadata = {
      module: AppModule,
      importsModules: [Module1],
      importsWithParams: [module3WithProviders, module4WithProviders],
      providersPerReq: [Provider1],
      ngMetadataName: 'RootModule',
    };

    const expectedMetadata3: NormalizedModuleMetadata = {
      module: AppModule,
      importsModules: [Module1],
      importsWithParams: [module4WithProviders],
      providersPerReq: [Provider1],
      ngMetadataName: 'RootModule',
    };

    const expectedMetadata4: NormalizedModuleMetadata = {
      module: AppModule,
      importsModules: [Module1],
      importsWithParams: [],
      providersPerReq: [Provider1],
      ngMetadataName: 'RootModule',
    };

    mock.scanRootModule(AppModule);
    const map = mock.getModules();
    expect(map.size).toBe(5);
    expect(map.get('root')).toEqual(expectedMetadata1);
    
    expect(mock.removeImport(Module2)).toBe(true);
    expect(map.size).toBe(4);
    expect(mock.removeImport(Module2)).toBe(false);
    expect(map.size).toBe(4);
    expect(map.get('root')).toEqual(expectedMetadata2);

    expect(mock.removeImport(module3WithProviders)).toBe(true);
    expect(map.size).toBe(3);
    expect(map.get('root')).toEqual(expectedMetadata3);

    expect(mock.removeImport(moduleId)).toBe(true);
    expect(map.size).toBe(2);
    expect(map.get('root')).toEqual(expectedMetadata4);
  });
});
