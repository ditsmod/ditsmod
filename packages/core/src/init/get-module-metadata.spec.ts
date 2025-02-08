import { DecoratorAndValue, forwardRef } from '#di';
import { AttachedMetadata, featureModule, RawMeta } from '#decorators/feature-module.js';
import { Provider } from '#di/types-and-models.js';
import { ModuleMetadata, ModuleWithParams } from '#types/module-metadata.js';
import { Providers } from '#utils/providers.js';
import { CallsiteUtils } from '#utils/callsites.js';
import { ModuleNormalizer } from './module-normalizer.js';
import { ModRefId, AnyObj } from '#types/mix.js';

describe('getModuleMetadata()', () => {
  class Provider0 {}
  class Provider1 {}
  class Provider2 {}

  class MockModuleNormalizer extends ModuleNormalizer {
    override getModuleMetadata(modRefId: ModRefId): DecoratorAndValue<AttachedMetadata>[] | AnyObj[] | undefined {
      return super.getModuleMetadata(modRefId);
    }
  }
  const mockModuleNormalizer = new MockModuleNormalizer();
  const getModuleMetadata = mockModuleNormalizer.getModuleMetadata.bind(mockModuleNormalizer);

  it('module without decorator', () => {
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toBeUndefined();
  });

  it('empty decorator', () => {
    @featureModule()
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toEqual<RawMeta[]>([{ decorator: featureModule, declaredInDir: CallsiteUtils.getCallerDir() }]);
  });

  it('@featureModule() decorator with id', () => {
    @featureModule({ id: 'someId' })
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toEqual<RawMeta[]>([
      {
        decorator: featureModule,
        id: 'someId',
        declaredInDir: CallsiteUtils.getCallerDir(),
      },
    ]);
  });

  it('decorator with some data', () => {
    @featureModule({ id: 'test-id' })
    class Module1 {}

    const metadata = getModuleMetadata(Module1);
    expect(metadata).toEqual<RawMeta[]>([
      {
        decorator: featureModule,
        id: 'test-id',
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
          params: [{ decorator: featureModule, metadata: { providersPerMod } as ModuleMetadata }],
        };
      }
    }

    const metadata = getModuleMetadata(Module1.withParams([Provider2]));
    expect(metadata).toEqual<RawMeta[]>([
      {
        decorator: featureModule,
        declaredInDir: CallsiteUtils.getCallerDir(),
        extensionsMeta: {},
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
          params: [{ decorator: featureModule, metadata: { providersPerMod } as ModuleMetadata }],
        };
      }
    }

    const fn = () => Module1.withParams([Provider1]);
    const metadata = getModuleMetadata(forwardRef(fn));
    expect(metadata).toEqual<RawMeta[]>([
      {
        decorator: featureModule,
        declaredInDir: CallsiteUtils.getCallerDir(),
        extensionsMeta: {},
        providersPerMod: [Provider1],
      },
    ]);
  });
});
