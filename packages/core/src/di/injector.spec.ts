import 'reflect-metadata';
import {
  fromSelf,
  inject,
  injectable,
  InjectionToken,
  Injector,
  optional,
  Provider,
  forwardRef,
  reflector,
  ResolvedProvider,
  methodFactory,
  skipSelf,
} from '.';

import { stringify } from './utils';
import { makeClassDecorator, makePropDecorator } from './decorator-factories';
import { getOriginalError } from './error-handling';

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

describe('injector', () => {
  it('should twiсe instantiate a class without side affect', () => {
    const injector1 = createInjector([Engine]);
    const engine1: Engine = injector1.get(Engine);
    const injector2 = createInjector([Engine]);
    const engine2: Engine = injector2.get(Engine);

    expect(engine1).toBeInstanceOf(Engine);
    expect(engine2).toBeInstanceOf(Engine);
  });

  it('should support method factory', () => {
    const spy1 = jest.fn();
    const spy2 = jest.fn();
    const spy3 = jest.fn();
    const controller = makeClassDecorator();
    const route = makePropDecorator((method: 'GET' | 'POST', path: string) => ({ method, path }));

    @controller({ providers: [] })
    class Controller {
      constructor(public dashboardSoftware: DashboardSoftware) {
        spy1();
      }

      @route('GET', 'some-path')
      method1(engine: Engine) {
        spy2();
        return new SportsCar(engine);
      }

      @route('POST', 'other-path')
      method2(engine: Engine, dashboard: Dashboard) {
        spy3();
        return new CarWithDashboard(engine, dashboard);
      }
    }

    const myCarToken = new InjectionToken('myCar');
    const injector = createInjector([
      DashboardSoftware,
      Engine,
      Dashboard,
      { token: Car, useFactory: [Controller, Controller.prototype.method1] },
      { token: myCarToken, useFactory: [Controller, Controller.prototype.method2] },
    ]);

    const car: SportsCar = injector.get(Car);
    expect(car).toBeInstanceOf(SportsCar);
    expect(car.engine).toBeInstanceOf(Engine);
    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(1);
    expect(spy3).toBeCalledTimes(0);

    const myCar: CarWithDashboard = injector.get(myCarToken);
    expect(myCar).toBeInstanceOf(CarWithDashboard);
    expect(myCar.engine).toBeInstanceOf(Engine);
    expect(myCar.dashboard).toBeInstanceOf(Dashboard);
    expect(spy1).toBeCalledTimes(2);
    expect(spy2).toBeCalledTimes(1);
    expect(spy3).toBeCalledTimes(1);

    const classMetadata = reflector.getClassMetadata<[{ providers: [] }]>(Controller);
    expect(classMetadata[0].value).toEqual([{ providers: [] }]);

    const propMetadata = reflector.getPropMetadata(Controller);
    const [, container1] = propMetadata.method1;
    expect(container1.decorator).toBe(route);
    expect(container1.value).toEqual({ method: 'GET', path: 'some-path' });
    const [, container2] = propMetadata.method2;
    expect(container2.decorator).toBe(route);
    expect(container2.value).toEqual({ method: 'POST', path: 'other-path' });
  });

  it('should support method factory without token', () => {
    const spy1 = jest.fn();
    const spy2 = jest.fn();
    const spy3 = jest.fn();
    const controller = makeClassDecorator();
    const route = makePropDecorator((method: 'GET' | 'POST', path: string) => ({ method, path }));

    @controller({ providers: [] })
    class Controller {
      constructor(public dashboardSoftware: DashboardSoftware) {
        spy1();
      }

      @route('GET', 'some-path')
      method1(engine: Engine) {
        spy2();
        return new SportsCar(engine);
      }

      @route('POST', 'other-path')
      method2(engine: Engine, dashboard: Dashboard) {
        spy3();
        return new CarWithDashboard(engine, dashboard);
      }
    }

    const injector = createInjector([
      DashboardSoftware,
      Engine,
      Dashboard,
      { useFactory: [Controller, Controller.prototype.method1] },
      { useFactory: [Controller, Controller.prototype.method2] },
    ]);

    const car: SportsCar = injector.get(Controller.prototype.method1);
    expect(car).toBeInstanceOf(SportsCar);
    expect(car.engine).toBeInstanceOf(Engine);
    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(1);
    expect(spy3).toBeCalledTimes(0);

    const myCar: CarWithDashboard = injector.get(Controller.prototype.method2);
    expect(myCar).toBeInstanceOf(CarWithDashboard);
    expect(myCar.engine).toBeInstanceOf(Engine);
    expect(myCar.dashboard).toBeInstanceOf(Dashboard);
    expect(spy1).toBeCalledTimes(2);
    expect(spy2).toBeCalledTimes(1);
    expect(spy3).toBeCalledTimes(1);

    const classMetadata = reflector.getClassMetadata<string>(Controller);
    expect(classMetadata[0].value).toEqual([{ providers: [] }]);

    const propMetadata = reflector.getPropMetadata(Controller);
    const [, container1] = propMetadata.method1;
    expect(container1.decorator).toBe(route);
    expect(container1.value).toEqual({ method: 'GET', path: 'some-path' });
    const [, container2] = propMetadata.method2;
    expect(container2.decorator).toBe(route);
    expect(container2.value).toEqual({ method: 'POST', path: 'other-path' });
  });

  it('should instantiate a class without dependencies', () => {
    const injector = createInjector([Engine]);
    const engine: Engine = injector.get(Engine);

    expect(engine).toBeInstanceOf(Engine);
  });

  it('should resolve dependencies based on @inject annotation', () => {
    const injector = createInjector([TurboEngine, Engine, CarWithInject]);
    const car: CarWithInject = injector.get(CarWithInject);

    expect(car).toBeInstanceOf(CarWithInject);
    expect(car.engine).toBeInstanceOf(TurboEngine);
  });

  it('should throw when no type and not @inject (class case)', () => {
    const msg = "Cannot resolve all parameters for 'NoAnnotations(?)";
    expect(() => createInjector([NoAnnotations])).toThrowError(msg);
  });

  it('should throw when no type and not @inject (factory case)', () => {
    class ClassWithFactory {
      @factory()
      method1(one: any) {
        return one;
      }
    }
    const msg = /Cannot resolve all parameters for 'ClassWithFactory.method1/;
    const providers: Provider[] = [
      { token: 'someToken', useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1] },
    ];
    expect(() => createInjector(providers)).toThrow(msg);
  });

  it('should throw when there no decorator for ClassWithFactory', () => {
    class ClassWithFactory {
      method1(one: any, two: any) {
        return one;
      }
    }

    const providers: Provider[] = [
      { token: 'someToken', useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1] },
    ];
    const msg = /Cannot resolve all parameters for 'ClassWithFactory.method1/;
    expect(() => createInjector(providers)).toThrowError(msg);
  });

  it('should throw when passing anonymous function to useFactory', () => {
    const prop = makePropDecorator();
    class ClassWithFactory {
      @prop()
      method1(one: any) {
        return one;
      }
    }

    const providers: Provider[] = [{ token: 'someToken', useFactory: [ClassWithFactory, () => ({})] }];
    const msg = 'Cannot find "anonymous()" as method in "ClassWithFactory".';
    expect(() => createInjector(providers)).toThrowError(msg);
  });

  it('should throw when passing fake value to useFactory', () => {
    const prop = makePropDecorator();
    class ClassWithFactory {
      @prop()
      method1(one: any) {
        return one;
      }
    }

    const providers: Provider[] = [{ token: 'someToken', useFactory: [ClassWithFactory, 'fakeValue' as any] }];
    const msg = 'Failed to create factory provider for someToken';
    expect(() => createInjector(providers)).toThrowError(msg);
  });

  it('should cache instances', () => {
    const injector = createInjector([Engine]);

    const e1: Engine = injector.get(Engine);
    const e2: Engine = injector.get(Engine);

    expect(e1).toEqual(e2);
  });

  it('should token to a value', () => {
    const injector = createInjector([{ token: Engine, useValue: 'fake engine' }]);

    const engine = injector.get(Engine) as string;
    expect(engine).toEqual('fake engine');
  });

  it('should inject dependencies instance of InjectionToken', () => {
    const TOKEN = new InjectionToken<string>('token');
    class ClassWithFactory {
      @factory()
      method1(@inject(TOKEN) one: string) {
        return one;
      }
    }

    const injector = createInjector([
      { token: TOKEN, useValue: 'by token' },
      { token: Engine, useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1] },
    ]);

    const engine = injector.get(Engine) as string;
    expect(engine).toEqual('by token');
  });

  it('should supporting provider to null', () => {
    const injector = createInjector([{ token: Engine, useValue: null }]);
    const engine = injector.get(Engine) as any;
    expect(engine).toBeNull();
  });

  it('should resolve dependencies based on type information', () => {
    const injector = createInjector([Engine, Car, CarWithOptionalEngine]);
    const car: Car = injector.get(Car);

    expect(car).toBeInstanceOf(Car);
    expect(car.engine).toBeInstanceOf(Engine);
  });

  it('should token to an alias', () => {
    const injector = createInjector([Engine, SportsCar, { token: Car, useToken: SportsCar }]);

    const car: SportsCar = injector.get(Car);
    const sportsCar: SportsCar = injector.get(SportsCar);
    expect(car).toBeInstanceOf(SportsCar);
    expect(car).toBe(sportsCar);
    expect(sportsCar.engine).toBeInstanceOf(Engine);
  });

  it('should support multiProviders that are created using useToken', () => {
    const injector = createInjector([Engine, SportsCar, { token: Car, useToken: SportsCar, multi: true }]);

    const cars: [SportsCar] = injector.get(Car);
    expect(cars.length).toEqual(1);
    expect(cars[0]).toBe(injector.get(SportsCar));
  });

  it('should support multiProviders', () => {
    const injector = createInjector([
      Engine,
      { token: Car, useClass: SportsCar, multi: true },
      { token: Car, useClass: CarWithOptionalEngine, multi: true },
    ]);

    const cars: [SportsCar, CarWithOptionalEngine] = injector.get(Car);
    expect(cars.length).toEqual(2);
    expect(cars[0]).toBeInstanceOf(SportsCar);
    expect(cars[1]).toBeInstanceOf(CarWithOptionalEngine);
  });

  it('should throw when the aliased provider does not exist', () => {
    const carToken = new InjectionToken('carToken');
    const injector = createInjector([{ token: carToken, useToken: SportsCar }]);
    const msg = 'No provider for SportsCar! (InjectionToken carToken -> SportsCar)';
    expect(() => injector.get(carToken)).toThrowError(msg);
  });

  it('should handle forwardRef in useToken', () => {
    const originalEngine = new InjectionToken('originalEngine');
    const aliasedEngine = new InjectionToken('aliasedEngine');
    const injector = createInjector([
      { token: originalEngine, useClass: forwardRef(() => Engine) },
      { token: aliasedEngine, useToken: forwardRef(() => originalEngine) },
    ]);
    expect(injector.get(aliasedEngine)).toBeInstanceOf(Engine);
  });

  it('should support overriding factory dependencies', () => {
    class ClassWithFactory {
      @factory()
      method1(engine: Engine) {
        return new SportsCar(engine);
      }
    }
    const injector = createInjector([
      Engine,
      { token: Car, useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1] },
    ]);

    const car: SportsCar = injector.get(Car);
    expect(car).toBeInstanceOf(SportsCar);
    expect(car.engine).toBeInstanceOf(Engine);
  });

  it('useFactory should works with methods keys as symbols', () => {
    const method = Symbol();
    class ClassWithFactory {
      @factory()
      [method](engine: Engine) {
        return new SportsCar(engine);
      }
    }
    const injector = createInjector([
      Engine,
      { token: Car, useFactory: [ClassWithFactory, ClassWithFactory.prototype[method]] },
    ]);

    const car: SportsCar = injector.get(Car);
    expect(car).toBeInstanceOf(SportsCar);
    expect(car.engine).toBeInstanceOf(Engine);
  });

  it('should support optional dependencies', () => {
    const injector = createInjector([CarWithOptionalEngine]);

    const car: CarWithOptionalEngine = injector.get(CarWithOptionalEngine);
    expect(car).toBeInstanceOf(CarWithOptionalEngine);
    expect(car.engine).toEqual(null);
  });

  it('should use the last provider when there are multiple providers for same token', () => {
    const injector = createInjector([
      { token: Engine, useClass: Engine },
      { token: Engine, useClass: TurboEngine },
    ]);

    expect(injector.get(Engine)).toBeInstanceOf(TurboEngine);
  });

  it('should throw when given invalid providers', () => {
    expect(() => createInjector(['blah'] as any)).toThrowError(
      'Invalid provider - only instances of Provider and Class are allowed, got: blah'
    );
  });

  it('should token itself', () => {
    const parent = createInjector([]);
    const child = parent.resolveAndCreateChild([]);

    expect(child.get(Injector)).toBe(child);
  });

  it('should throw when no provider defined', () => {
    const injector = createInjector([]);
    expect(() => injector.get('NonExisting')).toThrowError('No provider for NonExisting!');
  });

  it('should show the full path when no provider', () => {
    const injector = createInjector([CarWithDashboard, Engine, Dashboard]);
    expect(() => injector.get(CarWithDashboard)).toThrowError(
      `No provider for DashboardSoftware! (${stringify(CarWithDashboard)} -> ${stringify(
        Dashboard
      )} -> DashboardSoftware)`
    );
  });

  it('should throw when trying to instantiate a cyclic dependency', () => {
    const injector = createInjector([Car, { token: Engine, useClass: CyclicEngine }]);

    expect(() => injector.get(Car)).toThrowError(
      `Cannot instantiate cyclic dependency! (${stringify(Car)} -> ${stringify(Engine)} -> ${stringify(Car)})`
    );
  });

  it('should show the full path when error happens in a constructor', () => {
    const providers = Injector.resolve([Car, { token: Engine, useClass: BrokenEngine }]);
    const Storage = Injector.prepareStorage(providers);
    const injector = new Injector(Storage);

    try {
      injector.get(Car);
      throw new Error('Must throw');
    } catch (e: any) {
      expect(e.message).toContain(`Error during instantiation of Engine! (${stringify(Car)} -> Engine)`);
      expect(getOriginalError(e) instanceof Error).toBeTruthy();
    }
  });

  it('should instantiate an object after a failed attempt', () => {
    let isBroken = true;
    class ClassWithFactory {
      @factory()
      method1() {
        return isBroken ? new BrokenEngine() : new Engine();
      }
    }
    const injector = createInjector([
      Car,
      { token: Engine, useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1] },
    ]);

    const msg =
      'Broken Engine: Error during instantiation of ' +
      'Engine! (Car -> Engine). Caused by: Broken Engine';
    expect(() => injector.get(Car)).toThrowError(msg);

    isBroken = false;

    expect(injector.get(Car)).toBeInstanceOf(Car);
  });

  it('should support null values', () => {
    const valueToken = new InjectionToken('valueToken');
    const injector = createInjector([{ token: valueToken, useValue: null }]);
    expect(injector.get(valueToken)).toBe(null);
  });
});

describe('child', () => {
  it('should load instances from parent injector', () => {
    const parent = Injector.resolveAndCreate([Engine]);
    const child = parent.resolveAndCreateChild([]);

    const engineFromParent: Engine = parent.get(Engine);
    const engineFromChild: Engine = child.get(Engine);

    expect(engineFromChild).toBe(engineFromParent);
  });

  it('should load default value even with parent injector', () => {
    const parent = Injector.resolveAndCreate([]);
    const child = parent.resolveAndCreateChild([]);

    expect(() => {
      const result = parent.get(Engine, undefined, []);
      expect(result).toEqual([]);
    }).not.toThrow();

    expect(() => {
      const result = child.get(Engine, undefined, []);
      expect(result).toEqual([]);
    }).not.toThrow();
  });

  it('should not use the child providers when resolving the dependencies of a parent provider', () => {
    const parent = Injector.resolveAndCreate([Car, Engine]);
    const child = parent.resolveAndCreateChild([{ token: Engine, useClass: TurboEngine }]);

    const carFromChild: Car = child.get(Car);
    expect(carFromChild.engine).toBeInstanceOf(Engine);
  });

  it('should create new instance in a child injector', () => {
    const parent = Injector.resolveAndCreate([Engine]);
    const child = parent.resolveAndCreateChild([{ token: Engine, useClass: TurboEngine }]);

    const engineFromParent: TurboEngine = parent.get(Engine);
    const engineFromChild: TurboEngine = child.get(Engine);

    expect(engineFromParent).not.toBe(engineFromChild);
    expect(engineFromChild).toBeInstanceOf(TurboEngine);
  });

  it('should give access to parent', () => {
    const parent = Injector.resolveAndCreate([]);
    const child = parent.resolveAndCreateChild([]);
    expect(child.parent).toBe(parent);
  });
});

describe('resolveAndInstantiate', () => {
  it('should instantiate an object in the context of the injector', () => {
    const injector = Injector.resolveAndCreate([Engine]);
    const car: Car = injector.resolveAndInstantiate(Car);
    expect(car).toBeInstanceOf(Car);
    expect(car.engine).toBe(injector.get(Engine));
  });

  it('should not store the instantiated object in the injector', () => {
    const injector = Injector.resolveAndCreate([Engine]);
    injector.resolveAndInstantiate(Car);
    expect(() => injector.get(Car)).toThrowError();
  });
});

describe('instantiateResolved', () => {
  it('should instantiate an object in the context of the injector', () => {
    const injector = Injector.resolveAndCreate([Engine]);
    const map = Injector.resolve([Car]);
    const resolvedProvider = Array.from(map.values())[0];
    const car = injector.instantiateResolved(resolvedProvider);
    expect(car).toBeInstanceOf(Car);
    expect(car.engine).toBe(injector.get(Engine));
  });
});

describe('depedency resolution', () => {
  describe('@fromSelf()', () => {
    it('should return a dependency from self', () => {
      class ClassWithFactory {
        @factory()
        method1(@fromSelf() engine: Engine) {
          return new Car(engine);
        }
      }
      const injector = Injector.resolveAndCreate([
        Engine,
        { token: Car, useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1] },
      ]);

      const car: Car = injector.get(Car);
      expect(car).toBeInstanceOf(Car);
      expect(car.engine).toBeInstanceOf(Engine);
    });

    it('should throw when not requested provider on self', () => {
      class ClassWithFactory {
        @factory()
        method1(@fromSelf() engine: Engine) {
          return new Car(engine);
        }
      }
      const parent = Injector.resolveAndCreate([Engine]);
      const child = parent.resolveAndCreateChild([
        { token: Car, useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1] },
      ]);

      const msg = 'No provider for Engine! (Car -> Engine)';
      expect(() => child.get(Car)).toThrowError(msg);
    });
  });

  describe('default', () => {
    it('should not skip self', () => {
      class ClassWithFactory {
        @factory()
        method1(engine: Engine) {
          return new Car(engine);
        }
      }
      const parent = Injector.resolveAndCreate([Engine]);
      const child = parent.resolveAndCreateChild([
        { token: Engine, useClass: TurboEngine },
        { token: Car, useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1] },
      ]);

      expect(child.get(Car).engine).toBeInstanceOf(TurboEngine);
    });
  });
});

describe('resolve', () => {
  it('should resolve and flatten', () => {
    const resolvedProviders = Injector.resolve([Engine, BrokenEngine]);
    resolvedProviders.forEach((provider) => {
      if (!provider) {
        return;
      } // the result is a sparse array
      expect(provider instanceof ResolvedProvider).toBe(true);
    });
  });

  it('should support multi providers', () => {
    const map = Injector.resolve([
      { token: Engine, useClass: BrokenEngine, multi: true },
      { token: Engine, useClass: TurboEngine, multi: true },
    ]);
    const resolvedProvider = Array.from(map.values())[0];

    expect(resolvedProvider.dualKey.token).toBe(Engine);
    expect(resolvedProvider.multi).toEqual(true);
    expect(resolvedProvider.resolvedFactories.length).toEqual(2);
  });

  it('should support providers as hash', () => {
    const map = Injector.resolve([
      { token: Engine, useClass: BrokenEngine, multi: true },
      { token: Engine, useClass: TurboEngine, multi: true },
    ]);
    const resolvedProvider = Array.from(map.values())[0];

    expect(resolvedProvider.dualKey.token).toBe(Engine);
    expect(resolvedProvider.multi).toEqual(true);
    expect(resolvedProvider.resolvedFactories.length).toEqual(2);
  });

  it('should support multi providers with only one provider', () => {
    const map = Injector.resolve([{ token: Engine, useClass: BrokenEngine, multi: true }]);
    const resolvedProvider = Array.from(map.values())[0];

    expect(resolvedProvider.dualKey.token).toBe(Engine);
    expect(resolvedProvider.multi).toEqual(true);
    expect(resolvedProvider.resolvedFactories.length).toEqual(1);
  });

  it('should throw when mixing multi providers with regular providers', () => {
    expect(() => {
      Injector.resolve([{ token: Engine, useClass: BrokenEngine, multi: true }, Engine]);
    }).toThrowError(/Cannot mix multi providers and regular providers/);

    expect(() => {
      Injector.resolve([Engine, { token: Engine, useClass: BrokenEngine, multi: true }]);
    }).toThrowError(/Cannot mix multi providers and regular providers/);
  });

  it('should resolve forward references', () => {
    class ClassWithFactory {
      @factory()
      method1(@inject(forwardRef(() => Engine)) engine: Engine) {
        return 'OK';
      }
    }
    const map = Injector.resolve([
      forwardRef(() => Engine),
      { token: forwardRef(() => BrokenEngine), useClass: forwardRef(() => Engine) },
      { token: forwardRef(() => String), useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1] },
    ]);
    const resolvedProviders = Array.from(map.values());

    const engineProvider = resolvedProviders[0];
    const brokenEngineProvider = resolvedProviders[1];
    const stringProvider = resolvedProviders[2];

    expect(engineProvider.resolvedFactories[0].factory() instanceof Engine).toBe(true);
    expect(brokenEngineProvider.resolvedFactories[0].factory() instanceof Engine).toBe(true);
    expect(stringProvider.resolvedFactories[0].dependencies[0].dualKey.token).toEqual(Engine);

    const injector = Injector.fromResolvedProviders(map);
    expect(() => injector.get(Engine)).not.toThrow();
    expect(() => injector.get(BrokenEngine)).not.toThrow();
    expect(() => injector.get(String)).not.toThrow();
    expect(injector.get(Engine)).toBeInstanceOf(Engine);
    expect(injector.get(BrokenEngine)).toBeInstanceOf(Engine);
    expect(injector.get(String)).toBe('OK');
  });

  it('should support overriding factory dependencies with dependency annotations', () => {
    const factoryToken = new InjectionToken('factoryToken');
    const valueToken = new InjectionToken('valueToken');
    class ClassWithFactory {
      @factory()
      method1(@inject(valueToken) one: number) {
        return one;
      }
    }

    const useValue = "It's works!";
    const map = Injector.resolve([
      { token: factoryToken, useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1] },
      { token: valueToken, useValue },
    ]);
    const resolvedProviders = Array.from(map.values());
    const resolvedProvider = resolvedProviders[0];

    expect(resolvedProvider.resolvedFactories[0].dependencies[0].dualKey.token).toEqual(valueToken);
    const injector = Injector.fromResolvedProviders(map);
    expect(injector.get(factoryToken)).toBe(useValue);
  });
});

describe("null as provider's value", () => {
  it('should works with "undefined"', () => {
    const injector = Injector.resolveAndCreate([{ token: Engine, useValue: undefined }]);

    expect(() => {
      injector.get(Engine); // Create cache
      injector.get(Engine); // Get from cache
    }).not.toThrow();
    expect(injector.get(Engine)).toBe(undefined);
  });

  it('should works with "null"', () => {
    const injector = Injector.resolveAndCreate([{ token: Engine, useValue: null }]);

    expect(() => {
      injector.get(Engine); // Create cache
      injector.get(Engine); // Get from cache
    }).not.toThrow();
    expect(injector.get(Engine)).toBe(null);
  });

  it('should works with "0"', () => {
    const injector = Injector.resolveAndCreate([{ token: Engine, useValue: 0 }]);

    expect(() => {
      injector.get(Engine); // Create cache
      injector.get(Engine); // Get from cache
    }).not.toThrow();
    expect(injector.get(Engine)).toBe(0);
  });

  it('should works with ""', () => {
    const injector = Injector.resolveAndCreate([{ token: Engine, useValue: '' }]);

    expect(() => {
      injector.get(Engine); // Create cache
      injector.get(Engine); // Get from cache
    }).not.toThrow();
    expect(injector.get(Engine)).toBe('');
  });

  it('useFactory should throw an error', () => {
    class DashboardSoftware {}

    @injectable()
    class Dashboard {
      constructor(software: DashboardSoftware) {}
    }

    class Car {
      @methodFactory()
      method1(dashboard: Dashboard) {}
    }

    const injector = Injector.resolveAndCreate([
      Dashboard,
      { token: Car, useFactory: [Car, Car.prototype.method1] },
    ]);

    const msg = 'No provider for DashboardSoftware! (Car -> Dashboard -> DashboardSoftware)';
    expect(() => injector.get(Car)).toThrow(msg);
  });

  it('useFactory should work', () => {
    class DashboardSoftware {}

    @injectable()
    class Dashboard {
      constructor(software: DashboardSoftware) {}
    }

    class Car {
      @methodFactory()
      method1(dashboard: Dashboard) {}
    }

    const injector = Injector.resolveAndCreate([
      Dashboard,
      { token: Car, useFactory: [Car, Car.prototype.method1] },
      DashboardSoftware,
    ]);

    expect(() => injector.get(Car)).not.toThrow();
  });

  it('@skipSelf() should cause return value from parent', () => {
    const token = new InjectionToken('token');
    @injectable()
    class A {
      constructor(@inject(token) @skipSelf() public a: string) {}
    }
    const parent = Injector.resolveAndCreate([{ token, useValue: "parent's value" }]);
    const child = parent.resolveAndCreateChild([A, { token, useValue: "child's value" }]);
    expect(() => {
      const value = child.get(A) as A;
      expect(value).toBeInstanceOf(A);
      expect(value.a).toBe("parent's value");
    }).not.toThrow();
  });

  it('@skipSelf() should throw', () => {
    const token = new InjectionToken('token');
    @injectable()
    class A {
      constructor(@inject(token) @skipSelf() public a: string) {}
    }
    const parent = Injector.resolveAndCreate([]);
    const child = parent.resolveAndCreateChild([A, { token, useValue: "child's value" }]);
    const msg = 'No provider for InjectionToken token! (A -> InjectionToken token)';
    expect(() => child.get(A)).toThrow(msg);
  });

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
      const msg = 'No provider for Dependecy1! (Dependecy2 -> Dependecy1)';
      expect(() => injector.checkDeps(Dependecy2)).toThrow(msg);
      expect(spy).toBeCalledTimes(0);
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
      expect(() => injector.checkDeps(Dependecy2)).not.toThrow();
      expect(spy).toBeCalledTimes(0);
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

        @methodFactory()
        method1(dep: Dependecy1) {
          spy();
        }
      }

      const injector = Injector.resolveAndCreate([
        { token: Dependecy2, useFactory: [Dependecy2, Dependecy2.prototype.method1] },
      ]);
      const msg = 'No provider for Dependecy1! (Dependecy2 -> Dependecy1)';
      expect(() => injector.checkDeps(Dependecy2)).toThrow(msg);
      expect(spy).toBeCalledTimes(0);
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

        @methodFactory()
        method1(dep: Dependecy1) {
          spy();
        }
      }

      const injector = Injector.resolveAndCreate([
        Dependecy1,
        { token: Dependecy2, useFactory: [Dependecy2, Dependecy2.prototype.method1] },
      ]);
      const msg = 'No provider for Dependecy3! (Dependecy2 -> Dependecy3)';
      expect(() => injector.checkDeps(Dependecy2)).toThrow(msg);
      expect(spy).toBeCalledTimes(0);
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

        @methodFactory()
        method1(dep: Dependecy1) {
          spy();
        }
      }

      const injector = Injector.resolveAndCreate([
        Dependecy1,
        { token: Dependecy2, useFactory: [Dependecy2, Dependecy2.prototype.method1] },
      ]);
      expect(() => injector.checkDeps(Dependecy2)).not.toThrow();
      expect(spy).toBeCalledTimes(0);
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

        @methodFactory()
        method1(dep: Dependecy1) {
          spy();
        }
      }

      const parent = Injector.resolveAndCreate([Dependecy1]);
      const child = parent.resolveAndCreateChild([
        { token: Dependecy2, useFactory: [Dependecy2, Dependecy2.prototype.method1] },
      ]);
      expect(() => child.checkDeps(Dependecy2)).not.toThrow();
      expect(spy).toBeCalledTimes(0);
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
      const injector = parent.resolveAndCreateChild([Dependecy2]);
      const msg = 'No provider for Dependecy1! (Dependecy2 -> Dependecy1)';
      expect(() => injector.checkDeps(Dependecy2)).toThrow(msg);
      expect(spy).toBeCalledTimes(0);
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
      expect(() => injector.checkDeps(Dependecy2)).not.toThrow();
      expect(spy).toBeCalledTimes(0);
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
      expect(() => child.checkDeps(A)).not.toThrow();
      expect(spy).toBeCalledTimes(0);
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
      const msg = 'No provider for InjectionToken token! (A -> InjectionToken token)';
      expect(() => child.checkDeps(A)).toThrow(msg);
      expect(spy).toBeCalledTimes(0);
    });

    it('should ignore some deps even with parent injector', () => {
      class Dependecy1 {
        constructor() {
          spy();
        }
      }
      const parent = Injector.resolveAndCreate([]);
      const child = parent.resolveAndCreateChild([]);
      expect(() => parent.checkDeps(Dependecy1, undefined, [Dependecy1])).not.toThrow();
      expect(() => child.checkDeps(Dependecy1, undefined, [Dependecy1])).not.toThrow();
      expect(spy).toBeCalledTimes(0);
    });

    it('should load instances from parent injector', () => {
      class Dependecy1 {
        constructor() {
          spy();
        }
      }
      const parent = Injector.resolveAndCreate([Dependecy1]);
      const child = parent.resolveAndCreateChild([]);
      expect(() => parent.checkDeps(Dependecy1)).not.toThrow();
      expect(() => child.checkDeps(Dependecy1)).not.toThrow();
      expect(spy).toBeCalledTimes(0);
    });

    it('should throw when no provider defined', () => {
      const injector = createInjector([]);
      expect(() => injector.checkDeps('NonExisting')).toThrowError('No provider for NonExisting!');
    });
  });
});
