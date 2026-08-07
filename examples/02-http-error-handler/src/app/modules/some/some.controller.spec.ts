import { Injector } from '@holu/core';
import type { RequestContext } from '@holu/rest';
import { jest } from '@jest/globals';

import { RequestScopedController } from './some.controller.js';

describe('SomeController', () => {
  const send = jest.fn();
  const res = { send } as unknown as RequestContext;
  let someController: RequestScopedController;

  beforeEach(() => {
    send.mockRestore();
    const injector = Injector.resolveAndCreate([RequestScopedController]);
    someController = injector.get(RequestScopedController);
  });

  it('should say "ok"', () => {
    expect(() => someController.ok(res)).not.toThrow();
    expect(send).toHaveBeenCalledWith('Hello, World!');
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('should to throw an error', () => {
    expect(() => someController.throwError()).toThrow('Here some error occurred');
    expect(send).toHaveBeenCalledTimes(0);
  });
});
