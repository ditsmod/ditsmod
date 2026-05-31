import { Injector } from '@ditsmod/core';
import { RequestScopedController } from './app.module.js';

describe('ExampleController', () => {
  let exampleController: RequestScopedController;

  beforeEach(() => {
    const injector = Injector.resolveAndCreate([RequestScopedController]);
    exampleController = injector.get(RequestScopedController);
  });

  it('should say "Hello, World!"', () => {
    expect(() => exampleController.tellHello()).not.toThrow();
    expect(exampleController.tellHello()).toBe('ok1');
  });
});
