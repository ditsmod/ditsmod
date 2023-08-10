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

  it('should return "Hello, World!"', () => {
    expect(myService.helloWorld()).toBe('Hello, World!\n');
  });

  it('should return "Hello, admin!"', () => {
    expect(myService.helloAdmin()).toBe('Hello, admin!\n');
  });
});
