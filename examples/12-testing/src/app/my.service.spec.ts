import { Injector } from '@ditsmod/core';

import { MyService } from './my.service';
import { OtherService } from './other.service';

describe('MyService', () => {
  let myService: MyService;

  beforeEach(() => {
    const injector = Injector.resolveAndCreate([
      MyService,
      OtherService
    ]);

    myService = injector.get(MyService);
  });

  it('should return "Hello, World!"', async () => {
    await expect(myService.helloWorld()).resolves.toBe('Hello, World!\n');
  });

  it('should return "Hello, admin!"', async () => {
    await expect(myService.helloAdmin()).resolves.toBe('Hello, admin!\n');
  });
});
