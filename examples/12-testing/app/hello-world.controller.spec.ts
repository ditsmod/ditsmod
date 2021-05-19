import 'reflect-metadata';
import { ReflectiveInjector } from '@ts-stack/di';

import { HelloWorldController } from './hello-world.controller';
import { MyService } from './my.service';
import { Response } from '../../../packages/core/src';
import { OtherService } from './other.service';

describe('HelloWorldController', () => {
  let helloWorldController: HelloWorldController;

  beforeEach(() => {
    const injector = ReflectiveInjector.resolveAndCreate([
      MyService,
      OtherService,
      HelloWorldController,
      { provide: Response, useValue: { send: () => {} } },
    ]);

    helloWorldController = injector.get(HelloWorldController);
  });

  it('should not throw an error', async () => {
    await expect(helloWorldController.helloWorld()).resolves.not.toThrow();
    await expect(helloWorldController.helloAdmin()).resolves.not.toThrow();
  });
});
