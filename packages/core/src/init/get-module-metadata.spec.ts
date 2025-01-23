import { describe, expect, it } from 'vitest';

import { forwardRef } from '#di';
import { featureModule, RawMeta } from '#decorators/module.js';
import { Provider } from '#di/types-and-models.js';
import { ModuleMetadata, BaseModuleWithParams } from '#types/module-metadata.js';
import { getModuleMetadata } from './get-module-metadata.js';
import { Providers } from '#utils/providers.js';
import { CallsiteUtils } from '#utils/callsites.js';

describe('getModuleMetadata()', () => {
  class Provider0 {}
  class Provider1 {}
  class Provider2 {}
  class Provider3 {}
  class Provider4 {}

  it('module without decorator', () => {
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toBeUndefined();
  });

  it('empty decorator', () => {
    @featureModule()
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toEqual<RawMeta>({ decorator: featureModule, declaredInDir: CallsiteUtils.getCallerDir() });
  });

  it('@featureModule() decorator with id', () => {
    @featureModule({ id: 'someId' })
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toEqual<RawMeta>({
      decorator: featureModule,
      id: 'someId',
      declaredInDir: CallsiteUtils.getCallerDir(),
    });
  });

  it('decorator with some data', () => {
    @featureModule<ModuleMetadata & { anyProperty: any }>({ anyProperty: [] })
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toEqual<RawMeta & { anyProperty: any }>({
      decorator: featureModule,
      anyProperty: [],
      declaredInDir: CallsiteUtils.getCallerDir(),
    });
  });

  it('decorator with instance of Providers class', () => {
    const providers = new Providers().useValue('token2', 'value2');

    @featureModule({
      providersPerMod: [Provider1],
      providersPerRou: providers,
    })
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toEqual<RawMeta & { providersPerRou: any }>({
      decorator: featureModule,
      providersPerMod: [Provider1],
      providersPerRou: [{ token: 'token2', useValue: 'value2' }],
      declaredInDir: CallsiteUtils.getCallerDir(),
    });
  });

  it('module with params; some properties are in static metadata, some are in dynamic metadata, some are in both', () => {
    @featureModule({
      providersPerMod: [Provider1],
      providersPerRou: new Providers().useValue('token1', 'value1'),
      providersPerApp: [Provider0],
    })
    class Module1 {
      static withParams(
        providersPerMod: Provider[],
      ): BaseModuleWithParams<Module1> & { providersPerRou: Provider[]; providersPerReq: Provider[] } {
        return {
          module: Module1,
          providersPerMod,
          providersPerRou: [Provider3],
          providersPerReq: [Provider4],
        };
      }
    }

    const metadata = getModuleMetadata(Module1.withParams([Provider2]));
    expect(metadata).toEqual<RawMeta & { providersPerRou: Provider[]; providersPerReq: Provider[] }>({
      decorator: featureModule,
      declaredInDir: CallsiteUtils.getCallerDir(),
      extensionsMeta: {},
      providersPerApp: [Provider0], // From static metadata.
      providersPerMod: [Provider1, Provider2], // Merge from static and dynamic metadata.
      providersPerRou: [{ token: 'token1', useValue: 'value1' }, Provider3], // Transformation from class instance to an array.
      providersPerReq: [Provider4], // From dynamic metadata.
    });
  });

  it('module with params in forwardRef() function', () => {
    @featureModule({})
    class Module1 {
      static withParams(providersPerMod: Provider[]): BaseModuleWithParams<Module1> {
        return {
          module: Module1,
          providersPerMod,
        };
      }
    }

    const fn = () => Module1.withParams([Provider1]);
    const metadata = getModuleMetadata(forwardRef(fn));
    expect(metadata).toEqual<RawMeta>({
      decorator: featureModule,
      declaredInDir: CallsiteUtils.getCallerDir(),
      extensionsMeta: {},
      providersPerMod: [Provider1],
    });
  });

  it('module with param "id"', () => {
    @featureModule({ id: 'someId' })
    class Module1 {
      static withParams(providersPerMod: Provider[]): BaseModuleWithParams<Module1> {
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
