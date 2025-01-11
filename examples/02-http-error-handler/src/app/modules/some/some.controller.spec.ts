import { Injector } from '@ditsmod/core';
import { Res } from '@ditsmod/routing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SomeController } from './some.controller.js';

describe('SomeController', () => {
  const send = vi.fn();
  const res = { send } as unknown as Res;
  let someController: SomeController;

  beforeEach(() => {
    send.mockRestore();
    const injector = Injector.resolveAndCreate([SomeController]);
    someController = injector.get(SomeController);
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
