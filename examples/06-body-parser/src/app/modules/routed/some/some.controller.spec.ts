import { Injector } from '@ditsmod/core';
import { Res } from '@ditsmod/rest';
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

  it('should say "Hello, World!"', () => {
    expect(() => someController.tellHello(res)).not.toThrow();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('should work with POST', () => {
    expect(() => someController.post(res, { one: 1 })).not.toThrow();
    expect(sendJson).toHaveBeenCalledTimes(1);
  });
});
