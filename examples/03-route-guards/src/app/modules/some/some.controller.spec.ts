import 'reflect-metadata';
import { Injector, Res } from '@ditsmod/core';

import { SomeController } from './some.controller';

describe('SomeController', () => {
  const send = jest.fn();
  const res = { send } as unknown as Res;
  let someController: SomeController;

  beforeEach(() => {
    jest.restoreAllMocks();
    const injector = Injector.resolveAndCreate([SomeController]);
    someController = injector.get(SomeController);
  });

  it('should say "ok"', () => {
    expect(() => someController.ok(res)).not.toThrow();
    expect(send).toBeCalledWith('ok');
    expect(send).toBeCalledTimes(1);
  });

  it('should to throw an error', () => {
    expect(() => someController.throw401Error(res)).not.toThrow();
    expect(send).toBeCalledWith('some secret');
    expect(send).toBeCalledTimes(1);
  });

  it('should to throw an error', () => {
    expect(() => someController.throw403Error(res)).not.toThrow();
    expect(send).toBeCalledWith('some secret');
    expect(send).toBeCalledTimes(1);
  });
});
