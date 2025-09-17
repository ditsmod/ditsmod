import { reflector } from '#di';
import { featureModule } from './feature-module.js';
import { RootRawMetadata } from './module-raw-metadata.js';

describe('Module decorator', () => {
  it('empty decorator', () => {
    @featureModule({})
    class Module1 {}

    const metadata = reflector.getDecorators(Module1)!;
    expect(metadata.length).toBe(1);
    expect(metadata[0].decorator).toBe(featureModule);
  });

  it('decorator with some data', () => {
    @featureModule({ providersPerApp: [] })
    class Module1 {}

    const metadata = reflector.getDecorators(Module1)!;
    expect(metadata.length).toBe(1);
    expect(metadata[0].value).toEqual<RootRawMetadata>({
      providersPerApp: []
    });
  });

  it('multi decorator with some data', () => {
    @featureModule({ providersPerApp: [] })
    @featureModule()
    class Module1 {}

    const metadata = reflector.getDecorators(Module1)!;
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
      resolvedCollisionsPerMod: [],
    })
    class Module1 {}

    const metadata = reflector.getDecorators(Module1)!;
    expect(metadata.length).toBe(1);
    expect(metadata[0].value).toEqual<RootRawMetadata>({
      imports: [],
      providersPerApp: [],
      providersPerMod: [],
      extensionsMeta: {},
      resolvedCollisionsPerMod: [],
      exports: [],
      extensions: [],
    } as RootRawMetadata);
  });
});
