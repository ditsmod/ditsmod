import 'reflect-metadata';
import { Injector, Res } from '@ditsmod/core';

import { HelloWorldController } from './hello-world.controller';

describe('HelloWorldController', () => {
  const send = jest.fn((value) => value);
  const res = { send } as unknown as Res;
  let helloWorldController: HelloWorldController;

  beforeEach(() => {
    send.mockRestore();
    const injector = Injector.resolveAndCreate([HelloWorldController]);
    helloWorldController = injector.get(HelloWorldController);
  });

  it('should say "Hello World!"', () => {
    expect(() => helloWorldController.tellHello(res)).not.toThrow();
    expect(send).toBeCalledWith('Hello World!');
    expect(send).toBeCalledTimes(1);
  });
});
