import { jest } from '@jest/globals';
import 'reflect-metadata/lite';

import { makeClassDecorator, makeParamDecorator, makePropDecorator } from './decorator-factories.js';

import { KeyRegistry } from './key-registry.js';
import { Class, CTX_DATA, Dependency, getNewRegistry, Provider, ResolvedProvider } from './types-and-models.js';
import { stringify } from '#di/stringify.js';
import { fromSelf, inject, injectable, factoryMethod, optional, skipSelf } from './decorators.js';
import { InjectionToken } from './injection-token.js';
import { Injector } from './injector.js';
import { forwardRef } from './forward-ref.js';
import { reflector } from './reflection.js';
import {
  CannotFindFactoryAsMethod,
  CyclicDependency,
  FailedCreateFactoryProvider,
  InstantiationError,
  NoAnnotation,
  NoProvider,
} from './di-errors.js';

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
  constructor(
    public engine: Engine,
    public dashboard: Dashboard,
  ) {}
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
  describe('getDependencies() method', () => {
    const classDecorator = makeClassDecorator((data?: any) => data);
    const paramDecorator = makeParamDecorator((value: any) => value);
    const propDecorator = makePropDecorator((value: string) => value);

    class MockInjector extends Injector {
      static override getDependencies(Cls: Class, propertyKey?: string | symbol) {
        return super.getDependencies(Cls, propertyKey);
      }
    }

    class AType {
      constructor(public value: any) {}
    }

    class BType {
      constructor(public value: any) {}
    }

    class CType {
      constructor(public value: any) {}
    }

    class DType {
      constructor(public value: any) {}
    }

    describe('inheritance with decorators', () => {
      @classDecorator({ value: 'parent' })
      class Parent {
        @propDecorator('p1')
        @propDecorator('p2')
        a: AType;

        b: AType;

        @propDecorator('p3')
        set c(value: CType) {}

        @propDecorator('type')
        d: number;

        @propDecorator('p4')
        someMethod1(a: AType) {}

        @propDecorator('p5')
        someMethod2(@paramDecorator('method2 param1') b: BType, d: DType) {}

        someMethod3(
          @paramDecorator('method3 param1') c: CType,
          @paramDecorator('method3 param2 value1') @paramDecorator('method3 param2 value2') b: BType,
          a: AType,
        ) {}

        constructor(@paramDecorator('a') a: AType, @paramDecorator('b') b: BType, d: DType) {
          this.a = a;
          this.b = b;
        }
      }

      @classDecorator({ value: 'child' })
      class Child extends Parent {
        @propDecorator('child-p1')
        @propDecorator('child-p2')
        declare a: AType;

        declare b: AType;

        @propDecorator('child-p3')
        override set c(value: DType) {}

        @propDecorator('child-type')
        declare d: number;

        @propDecorator('child-p4')
        override someMethod1(a: BType) {}

        override someMethod3(
          @paramDecorator('child-method3 param1') c: CType,
          @paramDecorator('child-method3 param2 value1') @paramDecorator('child-method3 param2 value2') b: BType,
          d: DType,
        ) {}

        constructor(c: CType, @paramDecorator('b') b: BType, @paramDecorator('a') a: AType, d: DType) {
          super(a, b, d);
          this.a = a;
          this.b = b;
        }
      }

      const rest = [false, null, undefined] as const;

      it('Parent', () => {
        const deps1 = (Injector as typeof MockInjector).getDependencies(Parent);
        expect(deps1).toEqual([
          new Dependency(KeyRegistry.get(AType), ...rest),
          new Dependency(KeyRegistry.get(BType), ...rest),
          new Dependency(KeyRegistry.get(DType), ...rest),
        ]);
      });

      it('Child', () => {
        const deps2 = (Injector as typeof MockInjector).getDependencies(Child);
        expect(deps2).toEqual([
          new Dependency(KeyRegistry.get(CType), ...rest),
          new Dependency(KeyRegistry.get(BType), ...rest),
          new Dependency(KeyRegistry.get(AType), ...rest),
          new Dependency(KeyRegistry.get(DType), ...rest),
        ]);
      });
    });
  });

  describe('pull() method', () => {
    it('for a provider from current injector, behaves like "injector.get()"', () => {
      const injector = Injector.resolveAndCreate([Engine, Car]);
      expect(injector.pull(Car)).toBeInstanceOf(Car);
      expect(injector.pull(Car).engine).toBeInstanceOf(Engine);
      expect(injector.pull(Car) === injector.pull(Car)).toBe(true);
      expect(injector.pull(Car) === injector.get(Car)).toBe(true);
      expect(injector.pull(Car).engine === injector.pull(Car).engine).toBe(true);
    });

    it('child injector pull provider from parent injector, and instatiate it', () => {
      const parent = Injector.resolveAndCreate([Car]);
      const child = parent.resolveAndCreateChild([Engine]);
      expect(() => child.get(Car)).toThrow(new NoProvider([Engine, Car]));
      expect(child.pull(Car)).toBeInstanceOf(Car);
      expect(child.pull(Car).engine).toBeInstanceOf(Engine);
    });

    it('allow default value', () => {
      const injector = Injector.resolveAndCreate([]);
      expect(injector.pull(Engine, 'defaultValue')).toBe('defaultValue');
    });

    it('cyclic dependency (A -> B -> A)', () => {
      @injectable()
      class A {
        constructor(@inject(forwardRef(() => B)) b: any) {}
      }
      @injectable()
      class B {
        constructor(a: A) {}
      }
      const injector = Injector.resolveAndCreate([A, B]);
      expect(() => injector.pull(A, 'defaultValue')).toThrow(new CyclicDependency([A, B, A]));
    });

    it('cyclic dependency (A -> B -> C -> A)', () => {
      @injectable()
      class A {
        constructor(@inject(forwardRef(() => B)) b: any) {}
      }
      @injectable()
      class B {
        constructor(@inject(forwardRef(() => C)) c: any) {}
      }
      @injectable()
      class C {
        constructor(a: A) {}
      }
      const injector = Injector.resolveAndCreate([A, B, C]);
      expect(() => injector.pull(A, 'defaultValue')).toThrow(new CyclicDependency([A, C, B, A]));
    });
  });

  describe('class of registry', () => {
    it('getNewRegistry() should return different class on each call', () => {
      expect(getNewRegistry() !== getNewRegistry()).toBe(true);
    });

    it('prepared registry class no save state', () => {
      const Registry = Injector.prepareRegistry(Injector.resolve([Engine]));
      const injector1 = new Injector(Registry);
      const engine1 = injector1.get(Engine);
      const injector2 = new Injector(Registry);
      const engine2 = injector2.get(Engine);

      expect(engine1).toBeInstanceOf(Engine);
      expect(engine2).toBeInstanceOf(Engine);
      expect(engine1 !== engine2).toBe(true);
    });

    it('prepared registry should allow extends it after creation', () => {
      const Registry = Injector.prepareRegistry(Injector.resolve([Engine]));
      expect(new Registry()).toMatchObject({});

      const resolvedDeps = Injector.resolve([DashboardSoftware]);
      Injector.prepareRegistry(resolvedDeps, Registry);
      expect(new Registry()).toMatchObject({});

      const injector = new Injector(Registry);
      const engine = injector.get(Engine);
      const dashboardSoftware = injector.get(DashboardSoftware);

      expect(engine).toBeInstanceOf(Engine);
      expect(dashboardSoftware).toBeInstanceOf(DashboardSoftware);
    });

    it('injector.setById() should works', () => {
      const { id } = KeyRegistry.get(1);
      const injector = Injector.resolveAndCreate([Engine, { token: 1, useValue: 'value 1' }]);
      expect(injector.get(Engine)).toBeInstanceOf(Engine);
      expect(injector.get(1)).toBe('value 1');
      injector.setById(id, 'value 2');
      expect(injector.get(1)).toBe('value 2');
    });
  });

  it('should support function factory', () => {
    const spy1 = jest.fn();
    const spy2 = jest.fn();

    function method1(engine: Engine) {
      spy1();
      return new SportsCar(engine);
    }

    function method2(engine: Engine, dashboard: Dashboard) {
      spy2();
      return new CarWithDashboard(engine, dashboard);
    }

    const myCarToken = new InjectionToken('myCar');
    const injector = createInjector([
      DashboardSoftware,
      Engine,
      Dashboard,
      { token: Car, useFactory: method1, deps: [Engine] },
      { token: myCarToken, useFactory: method2, deps: [Engine, Dashboard] },
    ]);

    const car: SportsCar = injector.get(Car);
    expect(car).toBeInstanceOf(SportsCar);
    expect(car.engine).toBeInstanceOf(Engine);
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(0);

    const myCar: CarWithDashboard = injector.get(myCarToken);
    expect(myCar).toBeInstanceOf(CarWithDashboard);
    expect(myCar.engine).toBeInstanceOf(Engine);
    expect(myCar.dashboard).toBeInstanceOf(Dashboard);
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
  });

  it('should support function factory non-class tokens', () => {
    const spy1 = jest.fn();

    function method1(engine: Engine) {
      spy1();
      return new SportsCar(engine);
    }

    const token1 = new InjectionToken('token1');
    const token2 = new InjectionToken('token2');
    const injector = createInjector([
      { token: token1, useFactory: method1, deps: [token2] },
      { token: token2, useClass: Engine },
    ]);

    const car: SportsCar = injector.get(token1);
    expect(car).toBeInstanceOf(SportsCar);
    expect(car.engine).toBeInstanceOf(Engine);
    expect(spy1).toHaveBeenCalledTimes(1);
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
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(spy3).toHaveBeenCalledTimes(0);

    const myCar: CarWithDashboard = injector.get(myCarToken);
    expect(myCar).toBeInstanceOf(CarWithDashboard);
    expect(myCar.engine).toBeInstanceOf(Engine);
    expect(myCar.dashboard).toBeInstanceOf(Dashboard);
    expect(spy1).toHaveBeenCalledTimes(2);
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(spy3).toHaveBeenCalledTimes(1);

    const classMetadata = reflector.getDecorators<[{ providers: [] }]>(Controller)!;
    expect(classMetadata[0].value).toEqual([{ providers: [] }]);

    const propMetadata = reflector.getMetadata(Controller)!;
    const [container1] = propMetadata.method1.decorators;
    expect(container1.decorator).toBe(route);
    expect(container1.value).toEqual({ method: 'GET', path: 'some-path' });
    const [container2] = propMetadata.method2.decorators;
    expect(container2.decorator).toBe(route);
    expect(container2.value).toEqual({ method: 'POST', path: 'other-path' });
  });

  it('should support function factory without token', () => {
    const spy1 = jest.fn();
    const spy2 = jest.fn();

    function method1(engine: Engine) {
      spy1();
      return new SportsCar(engine);
    }

    function method2(engine: Engine, dashboard: Dashboard) {
      spy2();
      return new CarWithDashboard(engine, dashboard);
    }

    const injector = createInjector([
      DashboardSoftware,
      Engine,
      Dashboard,
      { useFactory: method1, deps: [Engine] },
      { useFactory: method2, deps: [Engine, Dashboard] },
    ]);

    const car: SportsCar = injector.get(method1);
    expect(car).toBeInstanceOf(SportsCar);
    expect(car.engine).toBeInstanceOf(Engine);
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(0);

    const myCar: CarWithDashboard = injector.get(method2);
    expect(myCar).toBeInstanceOf(CarWithDashboard);
    expect(myCar.engine).toBeInstanceOf(Engine);
    expect(myCar.dashboard).toBeInstanceOf(Dashboard);
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
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
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(spy3).toHaveBeenCalledTimes(0);

    const myCar: CarWithDashboard = injector.get(Controller.prototype.method2);
    expect(myCar).toBeInstanceOf(CarWithDashboard);
    expect(myCar.engine).toBeInstanceOf(Engine);
    expect(myCar.dashboard).toBeInstanceOf(Dashboard);
    expect(spy1).toHaveBeenCalledTimes(2);
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(spy3).toHaveBeenCalledTimes(1);

    const classMetadata = reflector.getDecorators<string>(Controller)!;
    expect(classMetadata[0].value).toEqual([{ providers: [] }]);

    const propMetadata = reflector.getMetadata(Controller)!;
    const [container1] = propMetadata.method1.decorators;
    expect(container1.decorator).toBe(route);
    expect(container1.value).toEqual({ method: 'GET', path: 'some-path' });
    const [container2] = propMetadata.method2.decorators;
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
    expect(() => createInjector([NoAnnotations])).toThrow(new NoAnnotation(NoAnnotations, [[]]));
  });

  it('should throw when no type and not @inject (factory case)', () => {
    class ClassWithFactory {
      @factory()
      method1(one: any) {
        return one;
      }
    }
    const providers: Provider[] = [
      { token: 'someToken', useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1] },
    ];
    expect(() => createInjector(providers)).toThrow(new NoAnnotation(ClassWithFactory, [[]], 'method1'));
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
    const err = new NoAnnotation(ClassWithFactory, [[], []], 'method1');
    expect(() => createInjector(providers)).toThrow(err);
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
    expect(() => createInjector(providers)).toThrow(new CannotFindFactoryAsMethod('anonymous', 'ClassWithFactory'));
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
    expect(() => createInjector(providers)).toThrow(new FailedCreateFactoryProvider('someToken', 'string'));
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

  describe('@inject(token, ctx)', () => {
    it('first dependency', () => {
      @injectable()
      class Dependecy1 {
        constructor(@inject(CTX_DATA) public contextParameter: string) {}
      }

      @injectable()
      class TargetClass {
        constructor(
          @inject(Dependecy1, 'ctx1') public dependecy1: Dependecy1,
          @inject(Dependecy1) public dependecy3: Dependecy1,
          public dependecy2: Dependecy1,
        ) {}
      }

      const injector = Injector.resolveAndCreate([TargetClass, Dependecy1]);

      const targetClass = injector.get(TargetClass) as TargetClass;
      expect(targetClass.dependecy1.contextParameter).toBe('ctx1');
      expect(targetClass.dependecy2.contextParameter).toBeUndefined();
      expect(targetClass.dependecy1).not.toBe(targetClass.dependecy2);
      expect(targetClass.dependecy2).toBe(targetClass.dependecy3);
    });

    it('second dependency', () => {
      @injectable()
      class Dependecy1 {
        constructor(@inject(CTX_DATA) public contextParameter: string) {}
      }

      @injectable()
      class TargetClass {
        constructor(
          @inject(Dependecy1) public dependecy1: Dependecy1,
          @inject(Dependecy1, 'ctx1') public dependecy2: Dependecy1,
          public dependecy3: Dependecy1,
        ) {}
      }

      const injector = Injector.resolveAndCreate([TargetClass, Dependecy1]);

      const targetClass = injector.get(TargetClass) as TargetClass;
      expect(targetClass.dependecy2.contextParameter).toBe('ctx1');
      expect(targetClass.dependecy3.contextParameter).toBeUndefined();
      expect(targetClass.dependecy2).not.toBe(targetClass.dependecy3);
      expect(targetClass.dependecy3).toBe(targetClass.dependecy1);
    });

    it('dependencies in several contexts', () => {
      @injectable()
      class Dependecy1 {
        constructor(@inject(CTX_DATA) public contextParameter: string) {}
      }

      @injectable()
      class TargetClass {
        constructor(
          @inject(Dependecy1) public dependecy1: Dependecy1,
          @inject(Dependecy1, 'ctx1') public dependecy2: Dependecy1,
          @inject(Dependecy1, 'ctx2') public dependecy3: Dependecy1,
        ) {}
      }

      const injector = Injector.resolveAndCreate([TargetClass, Dependecy1]);

      const targetClass = injector.get(TargetClass) as TargetClass;
      expect(targetClass.dependecy1.contextParameter).toBeUndefined();
      expect(targetClass.dependecy2.contextParameter).toBe('ctx1');
      expect(targetClass.dependecy3.contextParameter).toBe('ctx2');
      expect(targetClass.dependecy1).not.toBe(targetClass.dependecy2);
      expect(targetClass.dependecy2).not.toBe(targetClass.dependecy3);
      expect(targetClass.dependecy1).not.toBe(targetClass.dependecy3);
    });

    it('dependencies with factories', () => {
      @injectable()
      class Dependecy1 {
        constructor(@inject(CTX_DATA) public contextParameter: string) {}
      }

      @injectable()
      class TargetClass {
        method1(
          dependecy1: Dependecy1,
          @inject(Dependecy1, 'ctx1') dependecy2: Dependecy1,
          @inject(Dependecy1, 'ctx2') dependecy3: Dependecy1,
        ) {
          return { dependecy1, dependecy2, dependecy3 };
        }
      }

      const injector = Injector.resolveAndCreate([
        { useFactory: [TargetClass, TargetClass.prototype.method1] },
        Dependecy1,
      ]);

      const targetClass = injector.get(TargetClass.prototype.method1);
      expect(targetClass.dependecy1).toBeInstanceOf(Dependecy1);
      expect(targetClass.dependecy2.contextParameter).toBe('ctx1');
      expect(targetClass.dependecy3.contextParameter).toBe('ctx2');
      expect(targetClass.dependecy1).not.toBe(targetClass.dependecy2);
      expect(targetClass.dependecy2).not.toBe(targetClass.dependecy3);
      expect(targetClass.dependecy1).not.toBe(targetClass.dependecy3);
    });

    xit('for child dependency', () => {
      @injectable()
      class Dependecy1 {
        constructor(@inject(CTX_DATA) public contextParameter: string | number) {}
      }

      @injectable()
      class Dependecy2 {
        constructor(public childDependecy1: Dependecy1) {}
      }

      @injectable()
      class TargetClass {
        constructor(
          @inject(Dependecy2) public dependecy1: Dependecy2,
          @inject(Dependecy2, 'ctx1') public dependecy2: Dependecy2,
          @inject(Dependecy2, 0) public dependecy3: Dependecy2,
        ) {}
      }

      const injector = Injector.resolveAndCreate([TargetClass, Dependecy1, Dependecy2]);

      const targetClass = injector.get(TargetClass) as TargetClass;
      expect(targetClass.dependecy2.childDependecy1.contextParameter).toBe('ctx1');
      expect(targetClass.dependecy3.childDependecy1.contextParameter).toBe(0);
      expect(targetClass.dependecy2).not.toBe(targetClass.dependecy3);
    });
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
    expect(() => injector.get(carToken)).toThrow(new NoProvider([SportsCar, carToken]));
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
    expect(car.engine).toEqual(undefined);
  });

  it('should use the last provider when there are multiple providers for same token', () => {
    const injector = createInjector([
      { token: Engine, useClass: Engine },
      { token: Engine, useClass: TurboEngine },
    ]);

    expect(injector.get(Engine)).toBeInstanceOf(TurboEngine);
  });

  it('should throw when given invalid providers', () => {
    expect(() => createInjector(['blah'] as any)).toThrow(
      "Invalid provider - only instances of Provider and Class are allowed, got: 'blah'",
    );
  });

  it('should token itself', () => {
    const parent = createInjector([]);
    const child = parent.resolveAndCreateChild([]);

    expect(child.get(Injector)).toBe(child);
  });

  it('should throw when no provider defined', () => {
    const injector = createInjector([]);
    expect(() => injector.get('NonExisting')).toThrow(new NoProvider(['NonExisting']));
  });

  it('should show the full path when no provider', () => {
    const injector = createInjector([CarWithDashboard, Engine, Dashboard]);
    expect(() => injector.get(CarWithDashboard)).toThrow(
      `No provider for DashboardSoftware! (${stringify(CarWithDashboard)} -> ${stringify(
        Dashboard,
      )} -> DashboardSoftware)`,
    );
  });

  it('should show the full path when error happens in a constructor', () => {
    const providers = Injector.resolve([Car, { token: Engine, useClass: BrokenEngine }]);
    const Registry = Injector.prepareRegistry(providers);
    const injector = new Injector(Registry);
    const err = new InstantiationError(new Error('Broken Engine'), ['Engine (Car -> Engine)']);
    expect(() => injector.get(Car)).toThrow(err);
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

    const err = new InstantiationError(new Error('Broken Engine'), [Engine, Car]);
    expect(() => injector.get(Car)).toThrow(err);

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
    expect(() => injector.get(Car)).toThrow();
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

      expect(() => child.get(Car)).toThrow(new NoProvider([Engine, Car]));
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
    }).toThrow(/Cannot mix multi providers and regular providers/);

    expect(() => {
      Injector.resolve([Engine, { token: Engine, useClass: BrokenEngine, multi: true }]);
    }).toThrow(/Cannot mix multi providers and regular providers/);
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
      @factoryMethod()
      method1(dashboard: Dashboard) {}
    }

    const injector = Injector.resolveAndCreate([Dashboard, { token: Car, useFactory: [Car, Car.prototype.method1] }]);

    expect(() => injector.get(Car)).toThrow(new NoProvider([DashboardSoftware, Dashboard, Car]));
  });

  it('useFactory should work', () => {
    class DashboardSoftware {}

    @injectable()
    class Dashboard {
      constructor(software: DashboardSoftware) {}
    }

    class Car {
      @factoryMethod()
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
    const msg = 'No provider for token! (A -> token)';
    expect(() => child.get(A)).toThrow(new NoProvider([token, A]));
  });
});
