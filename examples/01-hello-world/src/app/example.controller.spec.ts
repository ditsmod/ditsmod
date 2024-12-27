import { Injector } from '@ditsmod/core';
import { describe, expect, it, beforeEach } from 'vitest';

import { DefaultController } from './app.module.js';

describe('ExampleController', () => {
  let exampleController: DefaultController;

  beforeEach(() => {
    const injector = Injector.resolveAndCreate([DefaultController]);
    exampleController = injector.get(DefaultController);
  });

  it('should say "Hello, World!"', () => {
    expect(() => exampleController.tellHello()).not.toThrow();
    expect(exampleController.tellHello()).toBe('ok1');
  });
});
