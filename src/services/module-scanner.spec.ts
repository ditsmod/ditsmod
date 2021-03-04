import 'reflect-metadata';
import * as http from 'http';
import { Injectable } from '@ts-stack/di';

import { RootModule } from '../decorators/root-module';
import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { ModuleType } from '../types/module-type';
import { ModuleScanner } from './module-scanner';
import { Module } from '../decorators/module';
import { ModuleWithParams } from '../types/module-with-params';
import { ServiceProvider } from '../types/service-provider';

describe('ModuleScanner', () => {
  class MockModuleScanner extends ModuleScanner {
    map = new Map<string | number | ModuleType | ModuleWithParams, NormalizedModuleMetadata>();
  }

  let mock: MockModuleScanner;

  beforeEach(() => {
    mock = new MockModuleScanner();
  });

  it('empty root module', () => {
    @RootModule()
    class AppModule {}

    mock.scanModule(AppModule);
    const expectedMetadata: NormalizedModuleMetadata = {
      ngMetadataName: 'RootModule',
    };

    expect(mock.map.size).toBe(1);
    expect(mock.map.get(AppModule)).toEqual(expectedMetadata);
  });

  it('root module with some metadata', () => {
    @RootModule({
      httpModule: http,
      listenOptions: { host: 'localhost', port: 3000 },
      prefixPerApp: 'api',
      serverName: 'Some-Server',
      serverOptions: {},
      imports: [],
      providersPerApp: [],
      controllers: [],
      exports: [],
    })
    class AppModule {}

    mock.scanModule(AppModule);
    const expectedMetadata: NormalizedModuleMetadata = {
      ngMetadataName: 'RootModule',
    };

    expect(mock.map.size).toBe(1);
    expect(mock.map.get(AppModule)).toEqual(expectedMetadata);
  });

  it('root module with imported some other modules', () => {
    @Module({ id: 1 })
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
      httpModule: http,
      listenOptions: { host: 'localhost', port: 3000 },
      prefixPerApp: 'api',
      serverName: 'Some-Server',
      serverOptions: {},
      imports: [Module1, Module2],
      providersPerApp: [],
      controllers: [],
      exports: [module4WithProviders],
    })
    class Module3 {}

    mock.scanModule(Module3);

    const module1Expect: NormalizedModuleMetadata = {
      id: 1,
      ngMetadataName: 'Module',
    };

    const module2Expect: NormalizedModuleMetadata = {
      ngMetadataName: 'Module',
      imports1: [Module1],
      exports1: [Module1],
      exports3: [Provider1],
      providersPerMod: [Provider1],
    };

    const module3Expect: NormalizedModuleMetadata = {
      imports1: [Module1, Module2],
      exports2: [module4WithProviders],
      ngMetadataName: 'RootModule',
    };

    const module4Expect: NormalizedModuleMetadata = {
      providersPerMod: [Provider2],
      ngMetadataName: 'Module',
    };

    expect(mock.map.size).toBe(4);
    expect(mock.map.get(1)).toEqual(module1Expect);
    expect(mock.map.get(Module2)).toEqual(module2Expect);
    expect(mock.map.get(Module3)).toEqual(module3Expect);
    expect(mock.map.get(module4WithProviders)).toEqual(module4Expect);
  });
});
