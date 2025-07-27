import { forwardRef, resolveForwardRef } from '#di';
import { featureModule, RawMeta } from '#decorators/feature-module.js';
import { Provider } from '#di/types-and-models.js';
import { ModuleWithParams } from '#types/module-metadata.js';
import { Providers } from '#utils/providers.js';
import { CallsiteUtils } from '#utils/callsites.js';
import { ModuleNormalizer } from './module-normalizer.js';
import { ModRefId } from '#types/mix.js';
import { isModuleWithParams } from '#utils/type-guards.js';
import { NormalizedMeta } from '#types/normalized-meta.js';

describe('ModuleNormalizer.getDecoratorMeta()', () => {
  class Provider0 {}
  class Provider1 {}
  class Provider2 {}

  class MockModuleNormalizer extends ModuleNormalizer {
    override getDecoratorMeta(modRefId: ModRefId) {
      return super.getDecoratorMeta(modRefId);
    }
    override mergeModuleWithParams(rawMeta: RawMeta, modWitParams: ModuleWithParams, baseMeta: NormalizedMeta) {
      return super.mergeModuleWithParams(rawMeta, modWitParams, baseMeta);
    }
  }
  const mockModuleNormalizer = new MockModuleNormalizer();
  function getModuleMetadata(modRefId: ModRefId) {
    modRefId = resolveForwardRef(modRefId);
    const mInitHooksAndRawMeta = mockModuleNormalizer.getDecoratorMeta(modRefId) || [];
    const aRawMeta = mInitHooksAndRawMeta.map((d) => {
      let rawMeta = d.value as RawMeta;
      if (isModuleWithParams(modRefId)) {
        rawMeta = mockModuleNormalizer.mergeModuleWithParams(rawMeta, modRefId, new NormalizedMeta());
      }
      return rawMeta;
    });
    return aRawMeta;
  }

  it('module without decorator', () => {
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toEqual([]);
  });

  it('empty decorator', () => {
    @featureModule()
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toEqual<RawMeta[]>([{ decorator: featureModule, declaredInDir: CallsiteUtils.getCallerDir() }]);
  });

  it('@featureModule() decorator with id', () => {
    @featureModule()
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toEqual<RawMeta[]>([
      {
        decorator: featureModule,
        declaredInDir: CallsiteUtils.getCallerDir(),
      },
    ]);
  });

  it('decorator with some data', () => {
    @featureModule()
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toEqual<RawMeta[]>([
      {
        decorator: featureModule,
        declaredInDir: CallsiteUtils.getCallerDir(),
      },
    ]);
  });

  it('decorator with instance of Providers class', () => {
    const providers = new Providers().useValue('token2', 'value2');

    @featureModule({
      providersPerMod: [Provider1],
    })
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toEqual<RawMeta[]>([
      {
        decorator: featureModule,
        providersPerMod: [Provider1],
        declaredInDir: CallsiteUtils.getCallerDir(),
      },
    ]);
  });

  it('module with params; some properties are in static metadata, some are in dynamic metadata, some are in both', () => {
    @featureModule({
      providersPerMod: [Provider1],
      providersPerApp: [Provider0],
    })
    class Module1 {
      static withParams(providersPerMod: Provider[]): ModuleWithParams<Module1> {
        return {
          module: Module1,
          providersPerMod,
        };
      }
    }

    const metadata = getModuleMetadata(Module1.withParams([Provider2]));
    expect(metadata).toEqual<RawMeta[]>([
      {
        decorator: featureModule,
        declaredInDir: CallsiteUtils.getCallerDir(),
        providersPerApp: [Provider0], // From static metadata.
        providersPerMod: [Provider1, Provider2], // Merge from static and dynamic metadata.
      },
    ]);
  });

  it('module with params in forwardRef() function', () => {
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
    expect(metadata).toEqual<RawMeta[]>([
      {
        decorator: featureModule,
        declaredInDir: CallsiteUtils.getCallerDir(),
        providersPerMod: [Provider1],
      },
    ]);
  });
});
