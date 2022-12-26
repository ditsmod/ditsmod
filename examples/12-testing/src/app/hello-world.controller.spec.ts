import 'reflect-metadata';
import { ReflectiveInjector } from '@ts-stack/di';
import { Res } from '@ditsmod/core';
import { HelloWorldController } from './hello-world.controller';
import { MyService } from './my.service';
import { OtherService } from './other.service';

describe('HelloWorldController', () => {
  let helloWorldController: HelloWorldController;

  beforeEach(() => {
    const injector = ReflectiveInjector.resolveAndCreate([
      MyService,
      OtherService,
      HelloWorldController,
      { token: Res, useValue: { send: () => {} } },
    ]);

    helloWorldController = injector.get(HelloWorldController);
  });

  it('should not throw an error', async () => {
    await expect(helloWorldController.helloWorld()).resolves.not.toThrow();
    await expect(helloWorldController.helloAdmin()).resolves.not.toThrow();
  });
});
