import { Injector, Res } from '@ditsmod/core';
import { jest } from '@jest/globals';

import { DefaultController } from './app.module.js';

describe('ExampleController', () => {
  const send = jest.fn();
  const res = { send } as unknown as Res;
  let exampleController: DefaultController;

  beforeEach(() => {
    jest.restoreAllMocks();
    const injector = Injector.resolveAndCreate([DefaultController]);
    exampleController = injector.get(DefaultController);
  });

  it('should say "Hello, World!"', () => {
    expect(() => exampleController.tellHello(res)).not.toThrow();
    expect(send).toHaveBeenCalledWith('Hello, World!');
    expect(send).toHaveBeenCalledTimes(1);
  });
});
