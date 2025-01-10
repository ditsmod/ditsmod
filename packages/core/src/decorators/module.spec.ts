import { describe, expect, it } from 'vitest';

import { reflector } from '#di';
import { featureModule } from './module.js';

describe('Module decorator', () => {
  it('empty decorator', () => {
    @featureModule({})
    class Module1 {}

    const metadata = reflector.getDecorators(Module1)!;
    expect(metadata.length).toBe(1);
    expect(metadata[0].decorator).toBe(featureModule);
    expect(metadata[0].value).toEqual({
      // guards: [],
      decorator: featureModule,
      declaredInDir: expect.stringContaining('decorators'),
    });
  });

  it('decorator with some data', () => {
    @featureModule({ controllers: [] })
    class Module1 {}

    const metadata = reflector.getDecorators(Module1)!;
    expect(metadata.length).toBe(1);
    expect(metadata[0].value).toEqual({
      controllers: [],
      // guards: [],
      decorator: featureModule,
      declaredInDir: expect.stringContaining('decorators'),
    });
  });

  it('multi decorator with some data', () => {
    @featureModule({ providersPerApp: [] })
    @featureModule({ controllers: [] })
    class Module1 {}

    const metadata = reflector.getDecorators(Module1)!;
    expect(metadata.length).toBe(2);
    expect(metadata[0].value).toEqual({
      controllers: [],
      // guards: [],
      decorator: featureModule,
      declaredInDir: expect.stringContaining('decorators'),
    });

    expect(metadata[1].value).toEqual({
      providersPerApp: [],
      // guards: [],
      decorator: featureModule,
      declaredInDir: expect.stringContaining('decorators'),
    });
  });

  it('decorator with all allowed properties', () => {
    @featureModule({
      imports: [],
      providersPerApp: [],
      providersPerMod: [],
      providersPerReq: [],
      controllers: [],
      exports: [],
      extensions: [],
    })
    class Module1 {}

    const metadata = reflector.getDecorators(Module1)!;
    expect(metadata.length).toBe(1);
    expect(metadata[0].value).toEqual({
      imports: [],
      providersPerApp: [],
      providersPerMod: [],
      providersPerReq: [],
      controllers: [],
      exports: [],
      extensions: [],
      // guards: [],
      decorator: featureModule,
      declaredInDir: expect.stringContaining('decorators'),
    });
  });
});
