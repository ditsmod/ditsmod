import type { Logger } from '@holu/core';
import { Injector } from '@holu/core';
import type { RequestContext } from '@holu/rest';
import { jest } from '@jest/globals';

import { SomeController } from './some.controller.js';

describe('SomeController', () => {
  const send = jest.fn();
  const log = jest.fn();
  const res = { send } as unknown as RequestContext;
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
