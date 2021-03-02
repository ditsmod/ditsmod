import 'reflect-metadata';
import { reflector } from '@ts-stack/di';

import { Module } from './module';

describe('Module decorator', () => {
  it('empty decorator', () => {
    @Module()
    class Module1 {}

    const metadata = reflector.annotations(Module1);
    expect(metadata.length).toBe(1);
    expect(metadata[0]).toEqual({});
    expect(metadata[0].ngMetadataName).toBe('Module');
  });

  it('decorator with some data', () => {
    @Module({ controllers: [] })
    class Module1 {}

    const metadata = reflector.annotations(Module1);
    expect(metadata.length).toBe(1);
    expect(metadata[0]).toEqual({ controllers: [] });
  });

  it('multi decorator with some data', () => {
    @Module({ providersPerApp: [] })
    @Module({ controllers: [] })
    class Module1 {}

    const metadata = reflector.annotations(Module1);
    expect(metadata.length).toBe(2);
    expect(metadata[0]).toEqual({ controllers: [] });
    expect(metadata[1]).toEqual({ providersPerApp: [] });
  });

  it('decorator with all allowed properties', () => {
    @Module({
      imports: [],
      providersPerApp: [],
      providersPerMod: [],
      providersPerReq: [],
      controllers: [],
      exports: [],
      extensions: [],
    })
    class Module1 {}

    const metadata = reflector.annotations(Module1);
    expect(metadata.length).toBe(1);
    expect(metadata[0]).toEqual({
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
