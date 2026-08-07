import { Injector } from '@holu/core';
import type { RequestContext } from '@holu/rest';
import { jest } from '@jest/globals';

import { RequestScopedController } from './some.controller.js';

describe('SomeController', () => {
  const send = jest.fn();
  const sendJson = jest.fn();
  const res = { send, sendJson } as unknown as RequestContext;
  let someController: RequestScopedController;

  beforeEach(() => {
    jest.restoreAllMocks();
    const injector = Injector.resolveAndCreate([RequestScopedController]);
    someController = injector.get(RequestScopedController);
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
