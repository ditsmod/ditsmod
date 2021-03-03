import 'reflect-metadata';
import * as http from 'http';

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
      ngMetadataName: 'RootModule'
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
      exports: []
    })
    class AppModule {}

    mock.scanModule(AppModule);
    const expectedMetadata: NormalizedModuleMetadata = {
      ngMetadataName: 'RootModule'
    };

    expect(mock.map.size).toBe(1);
    expect(mock.map.get(AppModule)).toEqual(expectedMetadata);
  });

  it('root module with imported some other modules', () => {
    @Module()
    class Module1 {}

    @RootModule({
      httpModule: http,
      listenOptions: { host: 'localhost', port: 3000 },
      prefixPerApp: 'api',
      serverName: 'Some-Server',
      serverOptions: {},
      imports: [Module1],
      providersPerApp: [],
      controllers: [],
      exports: []
    })
    class AppModule {}

    mock.scanModule(AppModule);
    const expectedMetadata1: NormalizedModuleMetadata = {
      imports1: [Module1],
      ngMetadataName: 'RootModule'
    };
    const expectedMetadata2: NormalizedModuleMetadata = {
      ngMetadataName: 'Module'
    };

    expect(mock.map.size).toBe(2);
    expect(mock.map.get(AppModule)).toEqual(expectedMetadata1);
    expect(mock.map.get(Module1)).toEqual(expectedMetadata2);
  });
});
