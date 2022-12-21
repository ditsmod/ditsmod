import 'reflect-metadata';
import * as http from 'http';
import { reflector } from '@ts-stack/di';
import { it, jest, describe, beforeEach, expect, xdescribe, beforeAll } from '@jest/globals';

import { RootModule } from './root-module';
import { AnyObj } from '../types/mix';

describe('RootModule decorator', () => {
  it('empty decorator', () => {
    @RootModule()
    class Module1 {}

    const metadata = reflector.getClassMetadata<AnyObj>(Module1);
    expect(metadata.length).toBe(1);
    expect(metadata[0]).toEqual({});
    expect(metadata[0].decoratorName).toBe('RootModule');
  });

  it('decorator with some data', () => {
    @RootModule({ controllers: [] })
    class Module1 {}

    const metadata = reflector.getClassMetadata(Module1);
    expect(metadata.length).toBe(1);
    expect(metadata[0]).toEqual({ controllers: [] });
  });

  it('multi decorator with some data', () => {
    @RootModule({ providersPerApp: [] })
    @RootModule({ controllers: [] })
    class Module1 {}

    const metadata = reflector.getClassMetadata(Module1);
    expect(metadata.length).toBe(2);
    expect(metadata[0]).toEqual({ controllers: [] });
    expect(metadata[1]).toEqual({ providersPerApp: [] });
  });

  it('decorator with all allowed properties', () => {
    @RootModule({
      httpModule: http,
      listenOptions: { host: 'localhost', port: 3000 },
      path: 'api',
      serverOptions: {},
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
    expect(metadata[0]).toEqual({
      httpModule: http,
      listenOptions: { host: 'localhost', port: 3000 },
      path: 'api',
      serverOptions: {},
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
