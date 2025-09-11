import { reflector } from '@ditsmod/core';
import { trpcController } from './trpc-controller.js';


describe('Controller decorator', () => {
  it('empty decorator', () => {
    @trpcController()
    class Controller1 {}

    const metadata = reflector.getDecorators(Controller1)!;
    expect(metadata.length).toBe(1);
    expect(metadata[0].value).toEqual({});
    expect(metadata[0].decorator).toBe(trpcController);
  });

  it('decorator with some data', () => {
    @trpcController({ providersPerReq: [] })
    class Controller1 {}

    const metadata = reflector.getDecorators(Controller1)!;
    expect(metadata.length).toBe(1);
    expect(metadata[0].value).toEqual({ providersPerReq: [] })!;
  });

  it('multi decorator with some data', () => {
    @trpcController({ providersPerReq: [] })
    @trpcController({ providersPerReq: [] })
    class Controller1 {}

    const metadata = reflector.getDecorators(Controller1)!;
    expect(metadata.length).toBe(2);
    expect(metadata[0].value).toEqual({ providersPerReq: [] });
    expect(metadata[1].value).toEqual({ providersPerReq: [] });
  });

  it('decorator with all allowed properties', () => {
    @trpcController({ providersPerRou: [], providersPerReq: [] })
    class Controller1 {}

    const metadata = reflector.getDecorators(Controller1)!;
    expect(metadata.length).toBe(1);
    expect(metadata[0].value).toEqual({ providersPerRou: [], providersPerReq: [] });
  });
});
