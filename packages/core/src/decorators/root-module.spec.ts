import { reflector } from '#di';
import { AnyObj } from '#types/mix.js';
import { rootModule } from './root-module.js';

describe('RootModule decorator', () => {
  it('empty decorator', () => {
    @rootModule({})
    class Module1 {}

    const metadata = reflector.getClassMetadata<AnyObj>(Module1);
    expect(metadata.length).toBe(1);
    expect(metadata[0].value).toEqual({});
    expect(metadata[0].decorator).toBe(rootModule);
  });

  it('decorator with some data', () => {
    @rootModule({ controllers: [] })
    class Module1 {}

    const metadata = reflector.getClassMetadata(Module1);
    expect(metadata.length).toBe(1);
    expect(metadata[0].value).toEqual({ controllers: [] });
  });

  it('multi decorator with some data', () => {
    @rootModule({ providersPerApp: [] })
    @rootModule({ controllers: [] })
    class Module1 {}

    const metadata = reflector.getClassMetadata(Module1);
    expect(metadata.length).toBe(2);
    expect(metadata[0].value).toEqual({ controllers: [] });
    expect(metadata[1].value).toEqual({ providersPerApp: [] });
  });

  it('decorator with all allowed properties', () => {
    @rootModule({
      imports: [],
      providersPerApp: [],
      providersPerMod: [],
      providersPerReq: [],
      controllers: [],
      exports: [],
      extensions: [],
    })
    class Module1 {}

    const metadata = reflector.getClassMetadata(Module1);
    expect(metadata.length).toBe(1);
    expect(metadata[0].value).toEqual({
      imports: [],
      providersPerApp: [],
      providersPerMod: [],
      providersPerReq: [],
      controllers: [],
      exports: [],
      extensions: [],
    });
  });
});
