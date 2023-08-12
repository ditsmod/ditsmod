import { Injector, Res } from '@ditsmod/core';
import BunyanLogger = require('bunyan');

import { BunyanController } from './bunyan.controller';

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
    expect(send).toBeCalledTimes(1);
    expect(info).toBeCalledTimes(1);
  });
});
