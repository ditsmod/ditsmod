import { forwardRef, injectable } from '#di';
import { featureModule } from '#decorators/module.js';
import { Provider } from '#types/mix.js';
import { ModuleWithParams } from '#types/module-metadata.js';
import { getModuleMetadata } from './get-module-metadata.js';
import { getCallerDir } from './callsites.js';
import { Providers } from '#utils/providers.js';

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
    expect(metadata).toEqual({ decoratorFactory: featureModule, guardsPerMod: [], declaredInDir: getCallerDir() });
  });

  it('@featureModule() decorator with id', () => {
    @featureModule({ id: 'someId' })
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toEqual({
      decoratorFactory: featureModule,
      id: 'someId',
      guardsPerMod: [],
      declaredInDir: getCallerDir(),
    });
  });

  it('decorator with some data', () => {
    @featureModule({ controllers: [] })
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toEqual({
      decoratorFactory: featureModule,
      guardsPerMod: [],
      controllers: [],
      declaredInDir: getCallerDir(),
    });
  });

  it('decorator with some data', () => {
    class Provider1 {}
    const providers = new Providers().useValue('token2', 'value2');

    @featureModule({
      providersPerMod: [Provider1],
      providersPerRou: providers,
    })
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toEqual({
      decoratorFactory: featureModule,
      guardsPerMod: [],
      providersPerMod: [Provider1],
      providersPerRou: [{ token: 'token2', useValue: 'value2' }],
      declaredInDir: getCallerDir(),
    });
  });

  it('module with params', () => {
    @injectable()
    class Provider1 {}

    @featureModule({})
    class Module1 {
      static withParams(providersPerMod: Provider[]): ModuleWithParams<Module1> {
        return {
          module: Module1,
          providersPerMod,
        };
      }
    }

    const metadata = getModuleMetadata(Module1.withParams([Provider1]));
    expect(metadata).toEqual({
      decoratorFactory: featureModule,
      declaredInDir: getCallerDir(),
      extensionsMeta: {},
      guardsPerMod: [],
      providersPerApp: [],
      exports: [],
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
      static withParams(providersPerMod: Provider[]): ModuleWithParams<Module1> {
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
      declaredInDir: getCallerDir(),
      extensionsMeta: {},
      guardsPerMod: [],
      providersPerApp: [],
      exports: [],
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
      static withParams(providersPerMod: Provider[]): ModuleWithParams<Module1> {
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
