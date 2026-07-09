import { rootModule, type RootDecoratorOptions } from './root-module.js';
import { Reflector } from '#di/reflector.js';

describe('RootModule decorator', () => {
  it('empty decorator', () => {
    @rootModule({})
    class Module1 {}

    const metadata = Reflector.getClassLevelMeta(Module1)!;
    expect(metadata.length).toBe(1);
    expect(metadata[0].decorator).toBe(rootModule);
    expect(metadata[0].declaredInDir).toContain('ditsmod/packages/core/dist/decorators');
  });

  it('decorator with some data', () => {
    @rootModule({ providersPerApp: [] })
    class Module1 {}

    const metadata = Reflector.getClassLevelMeta(Module1)!;
    expect(metadata.length).toBe(1);
  });

  it('multi decorator with some data', () => {
    @rootModule({ providersPerApp: [] })
    @rootModule()
    class Module1 {}

    const metadata = Reflector.getClassLevelMeta(Module1)!;
    expect(metadata.length).toBe(2);
  });

  it('decorator with all allowed properties', () => {
    const rootDecoratorOptions: RootDecoratorOptions = {
      imports: [],
      providersPerApp: [],
      providersPerMod: [],
      providersPerRou: [],
      providersPerReq: [],
      resolvedCollisionPerApp: [],
      resolvedCollisionPerMod: [],
      resolvedCollisionPerRou: [],
      resolvedCollisionPerReq: [],
      extensionsMeta: {},
      exports: [],
      extensions: [],
    };
    @rootModule(rootDecoratorOptions)
    class Module1 {}

    const metadata = Reflector.getClassLevelMeta(Module1)!;
    expect(metadata.length).toBe(1);
    expect(metadata[0].value).toEqual(rootDecoratorOptions);
    expect(metadata[0].value).not.toBe(rootDecoratorOptions);
  });
});
