import { Injector, Res } from '@ditsmod/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Controller1 } from './controller1.js';

describe('Module1 -> Controller1', () => {
  const send = vi.fn();
  const res = { send } as unknown as Res;
  let someController: Controller1;

  beforeEach(() => {
    send.mockRestore();
    const injector = Injector.resolveAndCreate([Controller1]);
    someController = injector.get(Controller1);
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
