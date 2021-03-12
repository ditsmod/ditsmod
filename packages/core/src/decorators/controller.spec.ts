import 'reflect-metadata';
import { reflector } from '@ts-stack/di';

import { Controller } from './controller';

describe('Controller decorator', () => {
  it('empty decorator', () => {
    @Controller()
    class Controller1 {}

    const metadata = reflector.annotations(Controller1);
    expect(metadata.length).toBe(1);
    expect(metadata[0]).toEqual({});
    expect(metadata[0].ngMetadataName).toBe('Controller');
  });

  it('decorator with some data', () => {
    @Controller({ providersPerReq: [] })
    class Controller1 {}

    const metadata = reflector.annotations(Controller1);
    expect(metadata.length).toBe(1);
    expect(metadata[0]).toEqual({ providersPerReq: [] });
  });

  it('multi decorator with some data', () => {
    @Controller({ providersPerReq: [] })
    @Controller({ providersPerReq: [] })
    class Controller1 {}

    const metadata = reflector.annotations(Controller1);
    expect(metadata.length).toBe(2);
    expect(metadata[0]).toEqual({ providersPerReq: [] });
    expect(metadata[1]).toEqual({ providersPerReq: [] });
  });

  it('decorator with all allowed properties', () => {
    @Controller({ providersPerReq: [] })
    class Controller1 {}

    const metadata = reflector.annotations(Controller1);
    expect(metadata.length).toBe(1);
    expect(metadata[0]).toEqual({ providersPerReq: [] });
  });
});
