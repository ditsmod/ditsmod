import { Injector } from '@ditsmod/core';
import { describe, expect, it, beforeEach } from 'vitest';

import { PerReqController } from './app.module.js';

describe('ExampleController', () => {
  let exampleController: PerReqController;

  beforeEach(() => {
    const injector = Injector.resolveAndCreate([PerReqController]);
    exampleController = injector.get(PerReqController);
  });

  it('should say "Hello, World!"', () => {
    const session = { one: 1, two: 2 };
    expect(() => exampleController.tellHello(session)).not.toThrow();
    expect(exampleController.tellHello(session)).toEqual(session);
  });
});
