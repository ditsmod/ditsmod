import { jest } from '@jest/globals';
import 'reflect-metadata/lite';

import { makePropDecorator } from './decorator-factories.js';
import { DepsChecker } from './deps-checker.js';
import {
  InjectionToken,
  Injector,
  Provider,
  inject,
  injectable,
  factoryMethod,
  optional,
  skipSelf,
  PathTracer
} from './index.js';
import { CyclicDependency, NoProvider } from './di-errors.js';

class Engine {}

class BrokenEngine {
  constructor() {
    throw new Error('Broken Engine');
  }
}

class DashboardSoftware {}

@injectable()
class Dashboard {
  constructor(software: DashboardSoftware) {}
}

class TurboEngine extends Engine {}

@injectable()
class Car {
  constructor(public engine: Engine) {}
}

@injectable()
class CarWithOptionalEngine {
  constructor(@optional() public engine: Engine) {}
}

@injectable()
class CarWithDashboard {
  constructor(public engine: Engine, public dashboard: Dashboard) {}
}

@injectable()
class SportsCar extends Car {}

@injectable()
class CarWithInject {
  constructor(@inject(TurboEngine) public engine: Engine) {}
}

@injectable()
class CyclicEngine {
  constructor(car: Car) {}
}

class NoAnnotations {
  constructor(secretDependency: any) {}
}

const factory = makePropDecorator();
const provider0 = new InjectionToken('provider0');
const provider1 = new InjectionToken('provider1');
const provider2 = new InjectionToken('provider2');
const provider3 = new InjectionToken('provider3');
const provider4 = new InjectionToken('provider4');
const provider5 = new InjectionToken('provider5');
const provider6 = new InjectionToken('provider6');
const provider7 = new InjectionToken('provider7');
const provider8 = new InjectionToken('provider8');
const provider9 = new InjectionToken('provider9');
const provider10 = new InjectionToken('provider10');

const dynamicProviders = [
  { token: provider0, useValue: 1 },
  { token: provider1, useValue: 1 },
  { token: provider2, useValue: 1 },
  { token: provider3, useValue: 1 },
  { token: provider4, useValue: 1 },
  { token: provider5, useValue: 1 },
  { token: provider6, useValue: 1 },
  { token: provider7, useValue: 1 },
  { token: provider8, useValue: 1 },
  { token: provider9, useValue: 1 },
  { token: provider10, useValue: 1 },
];

function createInjector(providers: Provider[], parent?: Injector | null): Injector {
  const resolvedProviders = Injector.resolve(providers.concat(dynamicProviders));
  if (parent != null) {
    return parent.createChildFromResolved(resolvedProviders) as Injector;
  } else {
    return Injector.fromResolvedProviders(resolvedProviders) as Injector;
  }
}

describe("null as provider's value", () => {
  describe('checkDeps()', () => {
    const spy = jest.fn();
    beforeEach(() => {
      spy.mockRestore();
    });

    it('should throw with simple dependency', () => {
      class Dependecy1 {
        constructor() {
          spy();
        }
      }

      @injectable()
      class Dependecy2 {
        constructor(dep: Dependecy1) {
          spy();
        }
      }

      const injector = Injector.resolveAndCreate([Dependecy2]);
      expect(() => DepsChecker.check(injector, Dependecy2)).toThrow(new NoProvider([Dependecy1, Dependecy2]));
      expect(spy).toHaveBeenCalledTimes(0);
    });

    it('should throw when trying to instantiate a cyclic dependency', () => {
      const injector = createInjector([Car, { token: Engine, useClass: CyclicEngine }]);
      expect(() => DepsChecker.check(injector, Car)).toThrow(new CyclicDependency([Car, Engine, Car]));
      expect(() => injector.get(Car)).toThrow(new CyclicDependency([Car, Engine, Car]));
    });

    it('should work with simple dependency', () => {
      class Dependecy1 {
        constructor() {
          spy();
        }
      }

      @injectable()
      class Dependecy2 {
        constructor(dep: Dependecy1) {
          spy();
        }
      }

      const injector = Injector.resolveAndCreate([Dependecy1, Dependecy2]);
      expect(() => DepsChecker.check(injector, Dependecy2)).not.toThrow();
      expect(spy).toHaveBeenCalledTimes(0);
    });

    it('should throw with factory', () => {
      class Dependecy1 {
        constructor() {
          spy();
        }
      }

      class Dependecy2 {
        constructor() {
          spy();
        }

        @factoryMethod()
        method1(dep: Dependecy1) {
          spy();
        }
      }

      const injector = Injector.resolveAndCreate([
        { token: Dependecy2, useFactory: [Dependecy2, Dependecy2.prototype.method1] },
      ]);
      expect(() => DepsChecker.check(injector, Dependecy2)).toThrow(new NoProvider([Dependecy1, Dependecy2]));
      expect(spy).toHaveBeenCalledTimes(0);
    });

    it('should throw with factory', () => {
      class Dependecy1 {
        constructor() {
          spy();
        }
      }
      class Dependecy3 {
        constructor() {
          spy();
        }
      }

      @injectable()
      class Dependecy2 {
        constructor(dep3: Dependecy3) {
          spy();
        }

        @factoryMethod()
        method1(dep: Dependecy1) {
          spy();
        }
      }

      const injector = Injector.resolveAndCreate([
        Dependecy1,
        { token: Dependecy2, useFactory: [Dependecy2, Dependecy2.prototype.method1] },
      ]);
      expect(() => DepsChecker.check(injector, Dependecy2)).toThrow(new NoProvider([Dependecy3, Dependecy2]));
      expect(spy).toHaveBeenCalledTimes(0);
    });

    it('should work with factory', () => {
      class Dependecy1 {
        constructor() {
          spy();
        }
      }

      class Dependecy2 {
        constructor() {
          spy();
        }

        @factoryMethod()
        method1(dep: Dependecy1) {
          spy();
        }
      }

      const injector = Injector.resolveAndCreate([
        Dependecy1,
        { token: Dependecy2, useFactory: [Dependecy2, Dependecy2.prototype.method1] },
      ]);
      expect(() => DepsChecker.check(injector, Dependecy2)).not.toThrow();
      expect(spy).toHaveBeenCalledTimes(0);
    });

    it('should work with factory and parent injector', () => {
      class Dependecy1 {
        constructor() {
          spy();
        }
      }

      class Dependecy2 {
        constructor() {
          spy();
        }

        @factoryMethod()
        method1(dep: Dependecy1) {
          spy();
        }
      }

      const parent = Injector.resolveAndCreate([Dependecy1]);
      const child = parent.resolveAndCreateChild([
        { token: Dependecy2, useFactory: [Dependecy2, Dependecy2.prototype.method1] },
      ]);
      expect(() => DepsChecker.check(child, Dependecy2)).not.toThrow();
      expect(spy).toHaveBeenCalledTimes(0);
    });

    it('should throw with parent', () => {
      class Dependecy1 {
        constructor() {
          spy();
        }
      }

      @injectable()
      class Dependecy2 {
        constructor(dep: Dependecy1) {
          spy();
        }
      }

      const parent = Injector.resolveAndCreate([]);
      const child = parent.resolveAndCreateChild([Dependecy2]);
      const pathTracer = new PathTracer();
      pathTracer.addItem(Dependecy2, child).addItem(Dependecy1, child).addItem(Dependecy1, parent);
      expect(() => DepsChecker.check(child, Dependecy2)).toThrow(new NoProvider(pathTracer.path));
      expect(spy).toHaveBeenCalledTimes(0);
    });

    it('should work with parent', () => {
      class Dependecy1 {
        constructor() {
          spy();
        }
      }

      @injectable()
      class Dependecy2 {
        constructor(dep: Dependecy1) {
          spy();
        }
      }

      const parent = Injector.resolveAndCreate([Dependecy1]);
      const injector = parent.resolveAndCreateChild([Dependecy2]);
      expect(() => DepsChecker.check(injector, Dependecy2)).not.toThrow();
      expect(spy).toHaveBeenCalledTimes(0);
    });

    it('@skipSelf() should cause return value from parent', () => {
      const token = new InjectionToken('token');
      @injectable()
      class A {
        constructor(@inject(token) @skipSelf() public a: string) {
          spy();
        }
      }
      const parent = Injector.resolveAndCreate([{ token, useValue: "parent's value" }]);
      const child = parent.resolveAndCreateChild([A, { token, useValue: "child's value" }]);
      expect(() => DepsChecker.check(child, A)).not.toThrow();
      expect(spy).toHaveBeenCalledTimes(0);
    });

    it('@skipSelf() should throw', () => {
      const token = new InjectionToken('token');
      @injectable()
      class A {
        constructor(@inject(token) @skipSelf() public a: string) {
          spy();
        }
      }
      const parent = Injector.resolveAndCreate([]);
      const child = parent.resolveAndCreateChild([A, { token, useValue: "child's value" }]);
      const pathTracer = new PathTracer();
      pathTracer.addItem(A, child).addItem(token, parent);
      expect(() => DepsChecker.check(child, A)).toThrow(new NoProvider(pathTracer.path));
      expect(spy).toHaveBeenCalledTimes(0);
    });

    it('should ignore some deps even with parent injector', () => {
      class Dependecy1 {
        constructor() {
          spy();
        }
      }
      const parent = Injector.resolveAndCreate([]);
      const child = parent.resolveAndCreateChild([]);
      expect(() => DepsChecker.check(parent, Dependecy1, undefined, [Dependecy1])).not.toThrow();
      expect(() => DepsChecker.check(child, Dependecy1, undefined, [Dependecy1])).not.toThrow();
      expect(spy).toHaveBeenCalledTimes(0);
    });

    it('should load instances from parent injector', () => {
      class Dependecy1 {
        constructor() {
          spy();
        }
      }
      const parent = Injector.resolveAndCreate([Dependecy1]);
      const child = parent.resolveAndCreateChild([]);
      expect(() => DepsChecker.check(parent, Dependecy1)).not.toThrow();
      expect(() => DepsChecker.check(child, Dependecy1)).not.toThrow();
      expect(spy).toHaveBeenCalledTimes(0);
    });

    it('should throw when no provider defined', () => {
      const injector = createInjector([]);
      expect(() => DepsChecker.check(injector, 'NonExisting')).toThrow(new NoProvider(['NonExisting']));
    });
  });
});
