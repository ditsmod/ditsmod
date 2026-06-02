import { Injector } from '@ditsmod/core';
import type { RequestContext } from '@ditsmod/rest';
import type { Logger as WinstonLogger } from 'winston';
import { jest } from '@jest/globals';

import { WinstonController } from './winston.controller.js';

describe('WinstonController', () => {
  const send = jest.fn();
  const info = jest.fn();
  const res = { send } as unknown as RequestContext;
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
    expect(send).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledTimes(1);
  });
});
