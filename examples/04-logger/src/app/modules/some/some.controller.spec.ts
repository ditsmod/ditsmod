import { Injector, Res, Logger } from '@ditsmod/core';

import { SomeController } from './some.controller';

describe('SomeController', () => {
  const send = jest.fn();
  const info = jest.fn();
  const res = { send } as unknown as Res;
  const logger = { info } as unknown as Logger;
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
    expect(send).toBeCalledTimes(1);
    expect(info).toBeCalledTimes(1);
  });
});
