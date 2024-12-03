import { injectable, factoryMethod } from '@ditsmod/core';

import { TestOverrider } from './test-overrider.js';
import { TestClassProvider, TestFactoryProvider } from './types.js';

describe('TestPreRouterExtension', () => {
  class MockTestPreRouterExtension extends TestOverrider {
    override getAllowedDeps(provider: TestClassProvider | TestFactoryProvider) {
      return super.getAllowedDeps(provider);
    }
  }

  let mock: MockTestPreRouterExtension;

  beforeEach(() => {
    mock = new MockTestPreRouterExtension();
  });

  describe('getAllowedDeps()', () => {
    it('should not to throw an error when there no providers', () => {
      class Service1 {}
      const provider1: TestClassProvider = { token: 'token1', useClass: Service1 };
      expect(() => mock.getAllowedDeps(provider1)).not.toThrow();
      const provider2: TestClassProvider = { token: 'token1', useClass: Service1, providers: [] };
      expect(() => mock.getAllowedDeps(provider2)).not.toThrow();
    });

    it('should return an array of allowed providers for ClassProvider', () => {
      class Dependecy1 {}
      class Dependecy2 {}
      class Dependecy3 {}

      @injectable()
      class Service1 {
        constructor(dep1: Dependecy1, dep2: Dependecy2) {}
      }

      const provider1: TestClassProvider = {
        token: 'token1',
        useClass: Service1,
        providers: [Dependecy1, Dependecy2, Dependecy3],
      };
      expect(() => mock.getAllowedDeps(provider1)).not.toThrow();
      const allowedDeps = mock.getAllowedDeps(provider1);
      expect(allowedDeps.length).toBe(2);
      expect(allowedDeps[0]).toBe(Dependecy1);
      expect(allowedDeps[1]).toBe(Dependecy2);
    });

    it('should return an array of allowed providers for FactoryProvider', () => {
      class Dependecy1 {}
      class Dependecy2 {}
      class Dependecy3 {}

      @injectable()
      class Service1 {
        constructor(dep2: Dependecy2) {}

        @factoryMethod()
        method1(dep1: Dependecy1) {}
      }

      const provider1: TestFactoryProvider = {
        token: 'token1',
        useFactory: [Service1, Service1.prototype.method1],
        providers: [Dependecy1, Dependecy2, Dependecy3],
      };
      expect(() => mock.getAllowedDeps(provider1)).not.toThrow();
      const allowedDeps = mock.getAllowedDeps(provider1);
      expect(allowedDeps.length).toBe(2);
      expect(allowedDeps[0]).toBe(Dependecy1);
      expect(allowedDeps[1]).toBe(Dependecy2);
    });
  });
});
