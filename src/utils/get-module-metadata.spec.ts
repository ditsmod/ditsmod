import 'reflect-metadata';

import { Module } from '../decorators/module';
import { ModuleWithParams } from '../types/module-with-params';
import { getModuleMetadata } from './get-module-metadata';

describe('getModuleMetadata', () => {
  it('empty decorator', () => {
    @Module()
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toEqual({});
  });

  it('decorator with some data', () => {
    @Module({ controllers: [] })
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toEqual({ controllers: [] });
  });

  it('decorator with params', () => {
    @Module()
    class Module1 {
      static withParams() {
        return { module: Module1, providersPerApp: [] } as ModuleWithParams<any>;
      }
    }

    const metadata = getModuleMetadata(Module1.withParams());
    expect(metadata).toEqual({
      ngMetadataName: 'Module',
      providersPerApp: [],
      providersPerMod: [],
      providersPerReq: [],
    });
  });
});
