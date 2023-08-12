import { Injector, Res } from '@ditsmod/core';
import { Logger as PinoLogger } from 'pino';

import { PinoController } from './pino.controller';

describe('PinoController', () => {
  const send = jest.fn();
  const info = jest.fn();
  const res = { send } as unknown as Res;
  const pinoLogger = { info } as unknown as PinoLogger;
  let pinoController: PinoController;

  beforeEach(() => {
    const injector = Injector.resolveAndCreate([PinoController]);
    pinoController = injector.get(PinoController);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('controller should send response', async () => {
    await expect(pinoController.ok(res, pinoLogger)).resolves.not.toThrow();
    expect(send).toBeCalledTimes(1);
    expect(info).toBeCalledTimes(1);
  });
});
