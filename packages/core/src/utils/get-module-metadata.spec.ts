import { forwardRef, Injectable } from '@ts-stack/di';
import 'reflect-metadata';

import { Module } from '../decorators/module';
import { ModuleWithParams, ServiceProvider } from '../types/mix';
import { getModuleMetadata } from './get-module-metadata';

describe('getModuleMetadata', () => {
  it('module without decorator', () => {
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toBeUndefined();
  });

  it('empty decorator', () => {
    @Module()
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toEqual({});
  });

  it('@Module() decorator with id', () => {
    @Module({ id: 'someId' })
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toEqual({ id: 'someId' });
  });

  it('decorator with some data', () => {
    @Module({ controllers: [] })
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toEqual({ controllers: [] });
  });

  it('module with params', () => {
    @Injectable()
    class Provider1 {}

    @Module()
    class Module1 {
      static withParams(providersPerMod: ServiceProvider[]): ModuleWithParams<Module1> {
        return {
          module: Module1,
          providersPerMod,
        };
      }
    }

    const metadata = getModuleMetadata(Module1.withParams([Provider1]));
    expect(metadata).toEqual({
      extensionsMeta: {},
      ngMetadataName: 'Module',
      providersPerApp: [],
      providersPerMod: [Provider1],
      providersPerRou: [],
      providersPerReq: [],
    });
  });

  it('module with params in forwardRef() function', () => {
    @Injectable()
    class Provider1 {}

    @Module()
    class Module1 {
      static withParams(providersPerMod: ServiceProvider[]): ModuleWithParams<Module1> {
        return {
          module: Module1,
          providersPerMod,
        };
      }
    }

    const fn = () => Module1.withParams([Provider1]);
    const metadata = getModuleMetadata(forwardRef(fn));
    expect(metadata).toEqual({
      extensionsMeta: {},
      ngMetadataName: 'Module',
      providersPerApp: [],
      providersPerMod: [Provider1],
      providersPerRou: [],
      providersPerReq: [],
    });
  });

  it('module with params has id', () => {
    @Injectable()
    class Provider1 {}

    @Module({ id: 'someId' })
    class Module1 {
      static withParams(providersPerMod: ServiceProvider[]): ModuleWithParams<Module1> {
        return {
          module: Module1,
          providersPerMod,
        };
      }
    }

    const obj = Module1.withParams([Provider1]);
    expect(() => getModuleMetadata(obj)).toThrow(/Module1 must not have an "id" in the metadata/);
  });
});
