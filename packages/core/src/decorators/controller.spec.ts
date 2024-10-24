import { reflector } from '#di';
import { AnyObj } from '#types/mix.js';
import { controller } from './controller.js';

describe('Controller decorator', () => {
  it('empty decorator', () => {
    @controller()
    class Controller1 {}

    const metadata = reflector.getMetadata<AnyObj>(Controller1)!.constructor.decorators;
    expect(metadata.length).toBe(1);
    expect(metadata[0].value).toEqual({});
    expect(metadata[0].decorator).toBe(controller);
  });

  it('decorator with some data', () => {
    @controller({ providersPerReq: [] })
    class Controller1 {}

    const metadata = reflector.getMetadata(Controller1)!.constructor.decorators;
    expect(metadata.length).toBe(1);
    expect(metadata[0].value).toEqual({ providersPerReq: [] });
  });

  it('multi decorator with some data', () => {
    @controller({ providersPerReq: [] })
    @controller({ providersPerReq: [] })
    class Controller1 {}

    const metadata = reflector.getMetadata(Controller1)!.constructor.decorators;
    expect(metadata.length).toBe(2);
    expect(metadata[0].value).toEqual({ providersPerReq: [] });
    expect(metadata[1].value).toEqual({ providersPerReq: [] });
  });

  it('decorator with all allowed properties', () => {
    @controller({ providersPerRou: [], providersPerReq: [] })
    class Controller1 {}

    const metadata = reflector.getMetadata(Controller1)!.constructor.decorators;
    expect(metadata.length).toBe(1);
    expect(metadata[0].value).toEqual({ providersPerRou: [], providersPerReq: [] });
  });
});
