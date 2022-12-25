import 'reflect-metadata';
import { reflector } from '@ts-stack/di';
import { it, jest, describe, beforeEach, expect, xdescribe, beforeAll } from '@jest/globals';

import { mod } from './module';

describe('Module decorator', () => {
  it('empty decorator', () => {
    @mod({})
    class Module1 {}

    const metadata = reflector.getClassMetadata<{}>(Module1);
    expect(metadata.length).toBe(1);
    expect(metadata[0].factory).toBe(mod);
    expect(metadata[0].value).toBeUndefined();
  });

  it('decorator with some data', () => {
    @mod({ controllers: [] })
    class Module1 {}

    const metadata = reflector.getClassMetadata(Module1);
    expect(metadata.length).toBe(1);
    expect(metadata[0].value).toEqual({ controllers: [] });
  });

  it('multi decorator with some data', () => {
    @mod({ providersPerApp: [] })
    @mod({ controllers: [] })
    class Module1 {}

    const metadata = reflector.getClassMetadata(Module1);
    expect(metadata.length).toBe(2);
    expect(metadata[0].value).toEqual({ controllers: [] });
    expect(metadata[1].value).toEqual({ providersPerApp: [] });
  });

  it('decorator with all allowed properties', () => {
    @mod({
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
