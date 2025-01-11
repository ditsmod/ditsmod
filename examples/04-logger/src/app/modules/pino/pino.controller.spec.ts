import { Injector } from '@ditsmod/core';
import { Res } from '@ditsmod/routing';
import { Logger as PinoLogger } from 'pino';
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';

import { PinoController } from './pino.controller.js';

describe('PinoController', () => {
  const send = vi.fn();
  const info = vi.fn();
  const res = { send } as unknown as Res;
  const pinoLogger = { info } as unknown as PinoLogger;
  let pinoController: PinoController;

  beforeEach(() => {
    const injector = Injector.resolveAndCreate([PinoController]);
    pinoController = injector.get(PinoController);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('controller should send response', async () => {
    await expect(pinoController.ok(res, pinoLogger)).resolves.not.toThrow();
    expect(send).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledTimes(1);
  });
});
