import 'reflect-metadata';
import * as http from 'http';
import { reflector } from '@ts-stack/di';

import { RootModule } from './root-module';

describe('RootModule decorator', () => {
  it('empty decorator', () => {
    @RootModule()
    class Module1 {}

    const metadata = reflector.annotations(Module1);
    expect(metadata.length).toBe(1);
    expect(metadata[0]).toEqual({});
    expect(metadata[0].ngMetadataName).toBe('RootModule');
  });

  it('decorator with some data', () => {
    @RootModule({ controllers: [] })
    class Module1 {}

    const metadata = reflector.annotations(Module1);
    expect(metadata.length).toBe(1);
    expect(metadata[0]).toEqual({ controllers: [] });
  });

  it('multi decorator with some data', () => {
    @RootModule({ providersPerApp: [] })
    @RootModule({ controllers: [] })
    class Module1 {}

    const metadata = reflector.annotations(Module1);
    expect(metadata.length).toBe(2);
    expect(metadata[0]).toEqual({ controllers: [] });
    expect(metadata[1]).toEqual({ providersPerApp: [] });
  });

  it('decorator with all allowed properties', () => {
    @RootModule({
      httpModule: http,
      listenOptions: { host: 'localhost', port: 3000 },
      path: 'api',
      serverName: 'Some-Server',
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

    const metadata = reflector.annotations(Module1);
    expect(metadata.length).toBe(1);
    expect(metadata[0]).toEqual({
      httpModule: http,
      listenOptions: { host: 'localhost', port: 3000 },
      path: 'api',
      serverName: 'Some-Server',
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
