import 'reflect-metadata';
import * as http from 'http';
import { reflector } from '@ts-stack/di';

import { rootModule } from './root-module';
import { AnyObj } from '../types/mix';

describe('RootModule decorator', () => {
  it('empty decorator', () => {
    @rootModule({})
    class Module1 {}

    const metadata = reflector.getClassMetadata<AnyObj>(Module1);
    expect(metadata.length).toBe(1);
    expect(metadata[0].value).toEqual({});
    expect(metadata[0].factory).toBe(rootModule);
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
    expect(metadata[0].value).toEqual({
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
