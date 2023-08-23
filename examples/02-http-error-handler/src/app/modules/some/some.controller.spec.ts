import { Injector, Res } from '@ditsmod/core';

import { SomeController } from './some.controller';

describe('SomeController', () => {
  const send = jest.fn();
  const res = { send } as unknown as Res;
  let someController: SomeController;

  beforeEach(() => {
    send.mockRestore();
    const injector = Injector.resolveAndCreate([SomeController]);
    someController = injector.get(SomeController);
  });

  it('should say "ok"', () => {
    expect(() => someController.ok(res)).not.toThrow();
    expect(send).toBeCalledWith('ok');
    expect(send).toBeCalledTimes(1);
  });

  it('should to throw an error', () => {
    expect(() => someController.throwError()).toThrow('Here some error occurred');
    expect(send).toBeCalledTimes(0);
  });
});
