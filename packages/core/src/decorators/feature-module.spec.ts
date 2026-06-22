import { Reflector } from '#di/reflector.js';
import { featureModule } from './feature-module.js';
import type { RootRawMetadata } from './root-module.js';

describe('Module decorator', () => {
  it('empty decorator', () => {
    @featureModule({})
    class Module1 {}

    const metadata = Reflector.getDecorators(Module1)!;
    expect(metadata.length).toBe(1);
    expect(metadata[0].decorator).toBe(featureModule);
    expect(metadata[0].declaredInDir).toContain('ditsmod/packages/core/dist/decorators');
  });

  it('decorator with some data', () => {
    @featureModule({ providersPerApp: [] })
    class Module1 {}

    const metadata = Reflector.getDecorators(Module1)!;
    expect(metadata.length).toBe(1);
    expect(metadata[0].value).toEqual<RootRawMetadata>({
      providersPerApp: [],
    });
  });

  it('multi decorator with some data', () => {
    @featureModule({ providersPerApp: [] })
    @featureModule()
    class Module1 {}

    const metadata = Reflector.getDecorators(Module1)!;
    expect(metadata.length).toBe(2);
  });

  it('decorator with all allowed properties', () => {
    @featureModule({
      imports: [],
      providersPerApp: [],
      providersPerMod: [],
      exports: [],
      extensions: [],
      extensionsMeta: {},
      resolvedCollisionPerMod: [],
    })
    class Module1 {}

    const metadata = Reflector.getDecorators(Module1)!;
    expect(metadata.length).toBe(1);
    expect(metadata[0].value).toEqual<RootRawMetadata>({
      imports: [],
      providersPerApp: [],
      providersPerMod: [],
      extensionsMeta: {},
      resolvedCollisionPerMod: [],
      exports: [],
      extensions: [],
    } as RootRawMetadata);
  });
});
