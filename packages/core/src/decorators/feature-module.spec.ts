import { reflector } from '#di';
import { InitHooksAndMetadata, RawMeta, featureModule } from './feature-module.js';

describe('Module decorator', () => {
  it('empty decorator', () => {
    @featureModule({})
    class Module1 {}

    const metadata = reflector.getDecorators(Module1)!;
    expect(metadata.length).toBe(1);
    expect(metadata[0].decorator).toBe(featureModule);
    expect(metadata[0].value).toEqual<InitHooksAndMetadata<RawMeta>>(
      new InitHooksAndMetadata({
        decorator: featureModule,
        declaredInDir: expect.stringContaining('decorators'),
      }),
    );
  });

  it('decorator with some data', () => {
    @featureModule()
    class Module1 {}

    const metadata = reflector.getDecorators(Module1)!;
    expect(metadata.length).toBe(1);
    expect(metadata[0].value).toEqual<InitHooksAndMetadata<RawMeta>>(
      new InitHooksAndMetadata({
        decorator: featureModule,
        declaredInDir: expect.stringContaining('decorators'),
      }),
    );
  });

  it('multi decorator with some data', () => {
    @featureModule({ providersPerApp: [] })
    @featureModule()
    class Module1 {}

    const metadata = reflector.getDecorators(Module1)!;
    expect(metadata.length).toBe(2);
    expect(metadata[0].value).toEqual<InitHooksAndMetadata<RawMeta>>(
      new InitHooksAndMetadata({
        decorator: featureModule,
        declaredInDir: expect.stringContaining('decorators'),
      }),
    );

    expect(metadata[1].value).toEqual<InitHooksAndMetadata<RawMeta>>(
      new InitHooksAndMetadata({
        decorator: featureModule,
        declaredInDir: expect.stringContaining('decorators'),
        providersPerApp: [],
      } as RawMeta),
    );
  });

  it('decorator with all allowed properties', () => {
    @featureModule({
      imports: [],
      providersPerApp: [],
      providersPerMod: [],
      exports: [],
      extensions: [],
      extensionsMeta: {},
      id: 'test-id',
      resolvedCollisionsPerMod: [],
    })
    class Module1 {}

    const metadata = reflector.getDecorators(Module1)!;
    expect(metadata.length).toBe(1);
    expect(metadata[0].value).toEqual<InitHooksAndMetadata<RawMeta>>(new InitHooksAndMetadata({
        decorator: featureModule,
        declaredInDir: expect.stringContaining('decorators'),
        imports: [],
        providersPerApp: [],
        providersPerMod: [],
        extensionsMeta: {},
        resolvedCollisionsPerMod: [],
        id: 'test-id',
        exports: [],
        extensions: [],
      } as RawMeta));
  });
});
