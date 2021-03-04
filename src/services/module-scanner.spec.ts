import 'reflect-metadata';
import * as http from 'http';
import { Injectable } from '@ts-stack/di';

import { RootModule } from '../decorators/root-module';
import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { ModuleType } from '../types/module-type';
import { ModuleScanner } from './module-scanner';
import { Module } from '../decorators/module';

describe('ModuleScanner', () => {
  class MockModuleScanner extends ModuleScanner {
    map = new Map<ModuleType, NormalizedModuleMetadata>();
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
    @Module()
    class Module1 {}

    @Injectable()
    class Provider1 {}

    @Module({
      imports: [Module1],
      providersPerMod: [Provider1],
      exports: [Provider1, Module1],
    })
    class Module2 {}

    @RootModule({
      httpModule: http,
      listenOptions: { host: 'localhost', port: 3000 },
      prefixPerApp: 'api',
      serverName: 'Some-Server',
      serverOptions: {},
      imports: [Module1, Module2],
      providersPerApp: [],
      controllers: [],
      exports: [],
    })
    class Module3 {}

    mock.scanModule(Module3);

    const expectedMetadata1: NormalizedModuleMetadata = {
      ngMetadataName: 'Module',
    };
    const expectedMetadata2: NormalizedModuleMetadata = {
      ngMetadataName: 'Module',
      imports1: [Module1],
      exports1: [Module1],
      exports3: [Provider1],
      providersPerMod: [Provider1],
    };
    const expectedMetadata3: NormalizedModuleMetadata = {
      imports1: [Module1, Module2],
      ngMetadataName: 'RootModule',
    };

    expect(mock.map.size).toBe(3);
    expect(mock.map.get(Module1)).toEqual(expectedMetadata1);
    expect(mock.map.get(Module2)).toEqual(expectedMetadata2);
    expect(mock.map.get(Module3)).toEqual(expectedMetadata3);
  });
});
