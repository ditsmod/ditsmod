import { Injector } from '@ditsmod/core';
import { Res } from '@ditsmod/rest';
import BunyanLogger from 'bunyan';
import { jest } from '@jest/globals';

import { BunyanController } from './bunyan.controller.js';

describe('BunyanController', () => {
  const send = jest.fn();
  const info = jest.fn();
  const res = { send } as unknown as Res;
  const bunyanLogger = { info } as unknown as BunyanLogger;
  let bunyanController: BunyanController;

  beforeEach(() => {
    const injector = Injector.resolveAndCreate([BunyanController]);
    bunyanController = injector.get(BunyanController);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('controller should send response', async () => {
    await expect(bunyanController.ok(res, bunyanLogger)).resolves.not.toThrow();
    expect(send).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledTimes(1);
  });
});
