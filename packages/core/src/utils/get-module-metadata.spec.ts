import 'reflect-metadata';
import { forwardRef, injectable } from '../di';

import { featureModule } from '../decorators/module';
import { ModuleWithParams, ServiceProvider } from '../types/mix';
import { getModuleMetadata } from './get-module-metadata';

describe('getModuleMetadata', () => {
  it('module without decorator', () => {
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toBeUndefined();
  });

  it('empty decorator', () => {
    @featureModule({})
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toEqual({ decoratorFactory: featureModule });
  });

  it('@Module() decorator with id', () => {
    @featureModule({ id: 'someId' })
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toEqual({ decoratorFactory: featureModule, id: 'someId' });
  });

  it('decorator with some data', () => {
    @featureModule({ controllers: [] })
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toEqual({
      decoratorFactory: featureModule,
      controllers: [],
    });
  });

  it('module with params', () => {
    @injectable()
    class Provider1 {}

    @featureModule({})
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
      decoratorFactory: featureModule,
      extensionsMeta: {},
      providersPerApp: [],
      providersPerMod: [Provider1],
      providersPerRou: [],
      providersPerReq: [],
    });
  });

  it('module with params in forwardRef() function', () => {
    @injectable()
    class Provider1 {}

    @featureModule({})
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
      decoratorFactory: featureModule,
      extensionsMeta: {},
      providersPerApp: [],
      providersPerMod: [Provider1],
      providersPerRou: [],
      providersPerReq: [],
    });
  });

  it('module with params has id', () => {
    @injectable()
    class Provider1 {}

    @featureModule({ id: 'someId' })
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
