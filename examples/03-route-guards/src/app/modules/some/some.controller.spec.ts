import { Injector, Res } from '@ditsmod/core';
import { jest } from '@jest/globals';

import { SomeController } from './some.controller.js';

describe('SomeController', () => {
  const send = jest.fn();
  const res = { send } as unknown as Res;
  let someController: SomeController;

  beforeEach(() => {
    send.mockRestore();
    const injector = Injector.resolveAndCreate([SomeController]);
    someController = injector.get(SomeController);
  });

  it('should say "ok"', () => {
    expect(() => someController.ok(res)).not.toThrow();
    expect(send).toHaveBeenCalledWith('ok');
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('should to throw an error', () => {
    expect(() => someController.throw401Error(res)).not.toThrow();
    expect(send).toHaveBeenCalledWith('some secret');
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('should to throw an error', () => {
    expect(() => someController.throw403Error(res)).not.toThrow();
    expect(send).toHaveBeenCalledWith('some secret');
    expect(send).toHaveBeenCalledTimes(1);
  });
});
