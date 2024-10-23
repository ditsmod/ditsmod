import { reflector } from '#di';
import { ModuleMetadataValue } from '#utils/get-module-metadata.js';
import { rootModule } from './root-module.js';

describe('RootModule decorator', () => {
  it('empty decorator', () => {
    @rootModule({})
    class Module1 {}

    const metadata = reflector.getMetadata<ModuleMetadataValue>(Module1).constructor.decorators;
    expect(metadata.length).toBe(1);
    expect(metadata[0].value.data).toEqual({});
    expect(metadata[0].decorator).toBe(rootModule);
  });

  it('decorator with some data', () => {
    @rootModule({ controllers: [] })
    class Module1 {}

    const metadata = reflector.getMetadata<ModuleMetadataValue>(Module1).constructor.decorators;
    expect(metadata.length).toBe(1);
    expect(metadata[0].value.data).toEqual({ controllers: [] });
  });

  it('multi decorator with some data', () => {
    @rootModule({ providersPerApp: [] })
    @rootModule({ controllers: [] })
    class Module1 {}

    const metadata = reflector.getMetadata<ModuleMetadataValue>(Module1).constructor.decorators;
    expect(metadata.length).toBe(2);
    expect(metadata[0].value.data).toEqual({ controllers: [] });
    expect(metadata[1].value.data).toEqual({ providersPerApp: [] });
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

    const metadata = reflector.getMetadata<ModuleMetadataValue>(Module1).constructor.decorators;
    expect(metadata.length).toBe(1);
    expect(metadata[0].value.data).toEqual({
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
