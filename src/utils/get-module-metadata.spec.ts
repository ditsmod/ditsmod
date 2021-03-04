import { forwardRef, Injectable } from '@ts-stack/di';
import 'reflect-metadata';

import { Module } from '../decorators/module';
import { ModuleWithParams } from '../types/module-with-params';
import { ServiceProvider } from '../types/service-provider';
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
      ngMetadataName: 'Module',
      providersPerApp: [],
      providersPerMod: [Provider1],
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
      ngMetadataName: 'Module',
      providersPerApp: [],
      providersPerMod: [Provider1],
      providersPerReq: [],
    });
  });
});
