import { reflector } from '#di';
import { rootModule } from './root-module.js';
import { RootRawMetadata } from './module-raw-metadata.js';

describe('RootModule decorator', () => {
  it('empty decorator', () => {
    @rootModule({})
    class Module1 {}

    const metadata = reflector.getDecorators(Module1)!;
    expect(metadata.length).toBe(1);
    expect(metadata[0].decorator).toBe(rootModule);
  });

  it('decorator with some data', () => {
    @rootModule({ providersPerApp: [] })
    class Module1 {}

    const metadata = reflector.getDecorators(Module1)!;
    expect(metadata.length).toBe(1);
  });

  it('multi decorator with some data', () => {
    @rootModule({ providersPerApp: [] })
    @rootModule()
    class Module1 {}

    const metadata = reflector.getDecorators(Module1)!;
    expect(metadata.length).toBe(2);
  });

  it('decorator with all allowed properties', () => {
    @rootModule({
      imports: [],
      providersPerApp: [],
      providersPerMod: [],
      exports: [],
      extensions: [],
    })
    class Module1 {}

    const metadata = reflector.getDecorators(Module1)!;
    expect(metadata.length).toBe(1);
    expect(metadata[0].value).toEqual<RootRawMetadata>({
      providersPerApp: [],
      providersPerMod: [],
      imports: [],
      exports: [],
      extensions: [],
    } as RootRawMetadata);
  });
});
