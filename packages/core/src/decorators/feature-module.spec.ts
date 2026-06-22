import { Reflector } from '#di/reflector.js';
import { featureModule } from './feature-module.js';
import type { ModuleRawMetadata } from './module-raw-metadata.js';

describe('Module decorator', () => {
  it('empty decorator', () => {
    @featureModule({})
    class Module1 {}

    const metadata = Reflector.getClassLevelMeta(Module1)!;
    expect(metadata.length).toBe(1);
    expect(metadata[0].decorator).toBe(featureModule);
    expect(metadata[0].declaredInDir).toContain('ditsmod/packages/core/dist/decorators');
  });

  it('decorator with some data', () => {
    @featureModule({ providersPerApp: [] })
    class Module1 {}

    const metadata = Reflector.getClassLevelMeta(Module1)!;
    expect(metadata.length).toBe(1);
    expect(metadata[0].value).toEqual<ModuleRawMetadata>({
      providersPerApp: [],
    });
  });

  it('multi decorator with some data', () => {
    @featureModule({ providersPerApp: [] })
    @featureModule()
    class Module1 {}

    const metadata = Reflector.getClassLevelMeta(Module1)!;
    expect(metadata.length).toBe(2);
  });

  it('decorator with all allowed properties', () => {
    const rootRawMeta: ModuleRawMetadata = {
      imports: [],
      providersPerApp: [],
      providersPerMod: [],
      providersPerRou: [],
      providersPerReq: [],
      resolvedCollisionPerMod: [],
      resolvedCollisionPerRou: [],
      resolvedCollisionPerReq: [],
      extensionsMeta: {},
      exports: [],
      extensions: [],
    };
    @featureModule(rootRawMeta)
    class Module1 {}

    const metadata = Reflector.getClassLevelMeta(Module1)!;
    expect(metadata.length).toBe(1);
    expect(metadata[0].value).toEqual(rootRawMeta);
  });
});
