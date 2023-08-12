import { Injector, Res } from '@ditsmod/core';
import { Logger as WinstonLogger } from 'winston';

import { WinstonController } from './winston.controller';

describe('WinstonController', () => {
  const send = jest.fn();
  const info = jest.fn();
  const res = { send } as unknown as Res;
  const winstonLogger = { info } as unknown as WinstonLogger;
  let winstonController: WinstonController;

  beforeEach(() => {
    const injector = Injector.resolveAndCreate([WinstonController]);
    winstonController = injector.get(WinstonController);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('controller should send response', async () => {
    await expect(winstonController.ok(res, winstonLogger)).resolves.not.toThrow();
    expect(send).toBeCalledTimes(1);
    expect(info).toBeCalledTimes(1);
  });
});
