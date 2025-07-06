import { reflector } from '#di';
import { rootModule } from './root-module.js';
import { PerModAttachedMetadata, RawMeta } from './feature-module.js';

describe('RootModule decorator', () => {
  it('empty decorator', () => {
    @rootModule({})
    class Module1 {}

    const metadata = reflector.getDecorators(Module1)!;
    expect(metadata.length).toBe(1);
    expect(metadata[0].value).toEqual<PerModAttachedMetadata<RawMeta>>(
      new PerModAttachedMetadata({
        decorator: rootModule,
        declaredInDir: expect.stringContaining('decorators'),
      }),
    );
    expect(metadata[0].decorator).toBe(rootModule);
  });

  it('decorator with some data', () => {
    @rootModule()
    class Module1 {}

    const metadata = reflector.getDecorators(Module1)!;
    expect(metadata.length).toBe(1);
    expect(metadata[0].value).toEqual<PerModAttachedMetadata<RawMeta>>(
      new PerModAttachedMetadata({
        decorator: rootModule,
        declaredInDir: expect.stringContaining('decorators'),
      }),
    );
  });

  it('multi decorator with some data', () => {
    @rootModule({ providersPerApp: [] })
    @rootModule()
    class Module1 {}

    const metadata = reflector.getDecorators(Module1)!;
    expect(metadata.length).toBe(2);
    expect(metadata[0].value).toEqual<PerModAttachedMetadata<RawMeta>>(
      new PerModAttachedMetadata({
        decorator: rootModule,
        declaredInDir: expect.stringContaining('decorators'),
      }),
    );

    expect(metadata[1].value).toEqual<PerModAttachedMetadata<RawMeta>>(
      new PerModAttachedMetadata({
        decorator: rootModule,
        declaredInDir: expect.stringContaining('decorators'),
        providersPerApp: [],
      } as RawMeta),
    );
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
    expect(metadata[0].value).toEqual<PerModAttachedMetadata<RawMeta>>(
      new PerModAttachedMetadata({
        decorator: rootModule,
        declaredInDir: expect.stringContaining('decorators'),
        providersPerApp: [],
        providersPerMod: [],
        imports: [],
        exports: [],
        extensions: [],
      } as RawMeta),
    );
  });
});
