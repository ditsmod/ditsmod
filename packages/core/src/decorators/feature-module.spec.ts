import { reflector } from '#di';
import { RawMeta, featureModule } from './feature-module.js';

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
    expect(metadata[0].value).toEqual<RawMeta>({
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
    expect(metadata[0].value).toEqual<RawMeta>({
      imports: [],
      providersPerApp: [],
      providersPerMod: [],
      extensionsMeta: {},
      resolvedCollisionsPerMod: [],
      exports: [],
      extensions: [],
    } as RawMeta);
  });
});
