import 'reflect-metadata';
import { reflector } from '@ts-stack/di';
import { it, jest, describe, beforeEach, expect, xdescribe, beforeAll } from '@jest/globals';

import { controller } from './controller';
import { AnyObj } from '../types/mix';

describe('Controller decorator', () => {
  it('empty decorator', () => {
    @controller()
    class Controller1 {}

    const metadata = reflector.getClassMetadata<AnyObj>(Controller1);
    expect(metadata.length).toBe(1);
    expect(metadata[0]).toEqual({});
    expect(metadata[0].value.decoratorFactory).toBe('Controller');
  });

  it('decorator with some data', () => {
    @controller({ providersPerReq: [] })
    class Controller1 {}

    const metadata = reflector.getClassMetadata(Controller1);
    expect(metadata.length).toBe(1);
    expect(metadata[0]).toEqual({ providersPerReq: [] });
  });

  it('multi decorator with some data', () => {
    @controller({ providersPerReq: [] })
    @controller({ providersPerReq: [] })
    class Controller1 {}

    const metadata = reflector.getClassMetadata(Controller1);
    expect(metadata.length).toBe(2);
    expect(metadata[0]).toEqual({ providersPerReq: [] });
    expect(metadata[1]).toEqual({ providersPerReq: [] });
  });

  it('decorator with all allowed properties', () => {
    @controller({ providersPerRou: [], providersPerReq: [] })
    class Controller1 {}

    const metadata = reflector.getClassMetadata(Controller1);
    expect(metadata.length).toBe(1);
    expect(metadata[0]).toEqual({ providersPerRou: [], providersPerReq: [] });
  });
});
