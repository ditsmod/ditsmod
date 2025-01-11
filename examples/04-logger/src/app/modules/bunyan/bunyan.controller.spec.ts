import { Injector } from '@ditsmod/core';
import { Res } from '@ditsmod/routing';
import BunyanLogger from 'bunyan';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BunyanController } from './bunyan.controller.js';

describe('BunyanController', () => {
  const send = vi.fn();
  const info = vi.fn();
  const res = { send } as unknown as Res;
  const bunyanLogger = { info } as unknown as BunyanLogger;
  let bunyanController: BunyanController;

  beforeEach(() => {
    const injector = Injector.resolveAndCreate([BunyanController]);
    bunyanController = injector.get(BunyanController);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('controller should send response', async () => {
    await expect(bunyanController.ok(res, bunyanLogger)).resolves.not.toThrow();
    expect(send).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledTimes(1);
  });
});
