import { Reflector } from '#di/reflector.js';
import { featureModule } from './feature-module.js';
import type { FeatureModuleOptions } from './module-decorator-options.js';

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
    expect(metadata[0].value).toEqual<FeatureModuleOptions>({
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
    const rootDecoratorOptions: FeatureModuleOptions = {
      imports: [],
      providersPerApp: [],
      providersPerMod: [],
      providersPerRou: [],
      providersPerReq: [],
      resolvedCollisionsPerMod: [],
      resolvedCollisionsPerRou: [],
      resolvedCollisionsPerReq: [],
      extensionsMeta: {},
      exports: [],
      extensions: [],
    };
    @featureModule(rootDecoratorOptions)
    class Module1 {}

    const metadata = Reflector.getClassLevelMeta(Module1)!;
    expect(metadata.length).toBe(1);
    expect(metadata[0].value).toEqual(rootDecoratorOptions);
  });
});
