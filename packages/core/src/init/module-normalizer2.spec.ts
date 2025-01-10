import { describe, expect, it } from 'vitest';

import { forwardRef, injectable } from '#di';
import { featureModule } from '#decorators/module.js';
import { Provider } from '#di/types-and-models.js';
import { ModuleWithParams } from '#types/module-metadata.js';
import { getModuleMetadata } from '#init/module-normalizer.js';
import { Providers } from '#utils/providers.js';
import { CallsiteUtils } from '#utils/callsites.js';

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
    expect(metadata).toEqual({ decorator: featureModule, guards: [], declaredInDir: CallsiteUtils.getCallerDir() });
  });

  it('@featureModule() decorator with id', () => {
    @featureModule({ id: 'someId' })
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toEqual({
      decorator: featureModule,
      id: 'someId',
      guards: [],
      declaredInDir: CallsiteUtils.getCallerDir(),
    });
  });

  it('decorator with some data', () => {
    @featureModule({ controllers: [] })
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toEqual({
      decorator: featureModule,
      guards: [],
      controllers: [],
      declaredInDir: CallsiteUtils.getCallerDir(),
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
      decorator: featureModule,
      guards: [],
      providersPerMod: [Provider1],
      providersPerRou: [{ token: 'token2', useValue: 'value2' }],
      declaredInDir: CallsiteUtils.getCallerDir(),
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
      decorator: featureModule,
      declaredInDir: CallsiteUtils.getCallerDir(),
      extensionsMeta: {},
      guards: [],
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
      decorator: featureModule,
      declaredInDir: CallsiteUtils.getCallerDir(),
      extensionsMeta: {},
      guards: [],
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
