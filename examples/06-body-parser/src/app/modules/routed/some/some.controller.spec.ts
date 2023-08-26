import { Injector, Res } from '@ditsmod/core';
import { jest } from '@jest/globals';

import { SomeController } from './some.controller.js';

describe('SomeController', () => {
  const send = jest.fn();
  const sendJson = jest.fn();
  const res = { send, sendJson } as unknown as Res;
  let someController: SomeController;

  beforeEach(() => {
    jest.restoreAllMocks();
    const injector = Injector.resolveAndCreate([SomeController]);
    someController = injector.get(SomeController);
  });

  it('should say "Hello World!"', () => {
    expect(() => someController.tellHello(res)).not.toThrow();
    expect(send).toBeCalledTimes(1);
  });

  it('should work with POST', () => {
    expect(() => someController.post(res, { one: 1 })).not.toThrow();
    expect(sendJson).toBeCalledTimes(1);
  });
});
