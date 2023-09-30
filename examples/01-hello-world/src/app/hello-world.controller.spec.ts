import { Injector, Res } from '@ditsmod/core';
import { jest } from '@jest/globals';

import { HelloWorldController } from './hello-world.controller.js';

describe('HelloWorldController', () => {
  const send = jest.fn();
  const res = { send } as unknown as Res;
  let helloWorldController: HelloWorldController;

  beforeEach(() => {
    jest.restoreAllMocks();
    const injector = Injector.resolveAndCreate([HelloWorldController]);
    helloWorldController = injector.get(HelloWorldController);
  });

  it('should say "Hello World!"', () => {
    expect(() => helloWorldController.tellHello(res)).not.toThrow();
    expect(send).toBeCalledWith('Hello, World!');
    expect(send).toBeCalledTimes(1);
  });
});
