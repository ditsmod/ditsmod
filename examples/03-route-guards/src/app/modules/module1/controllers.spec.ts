import { Injector } from '@ditsmod/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { InjController } from './controllers.js';

describe('Module1 -> Controller1', () => {
  let someController: InjController;

  beforeEach(() => {
    const injector = Injector.resolveAndCreate([InjController]);
    someController = injector.get(InjController);
  });

  describe('request-scoped controller', () => {
    it('should say "ok"', () => {
      expect(() => someController.ok()).not.toThrow();
      expect(someController.ok()).toBe('ok');
    });

    it('should to throw an error', () => {
      expect(() => someController.throw401Error()).not.toThrow();
      expect(someController.throw401Error()).toBe('some secret');
    });

    it('should to throw an error', () => {
      expect(() => someController.throw403Error()).not.toThrow();
      expect(someController.throw403Error()).toBe('some secret');
    });
  });
});
