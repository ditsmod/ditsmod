import type { Logger } from '@ditsmod/core';
import { Injector } from '@ditsmod/core';
import type { Res } from '@ditsmod/rest';
import { jest } from '@jest/globals';

import { SomeController } from './some.controller.js';

describe('SomeController', () => {
  const send = jest.fn();
  const log = jest.fn();
  const res = { send } as unknown as Res;
  const logger = { log } as unknown as Logger;
  let someController: SomeController;

  beforeEach(() => {
    const injector = Injector.resolveAndCreate([SomeController]);
    someController = injector.get(SomeController);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('controller should send response', async () => {
    await expect(someController.ok(res, logger)).resolves.not.toThrow();
    expect(send).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledTimes(1);
  });
});
