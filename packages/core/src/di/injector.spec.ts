import { jest } from '@jest/globals';
import 'reflect-metadata/lite';

import { makeClassDecorator, makeParamDecorator, makePropDecorator } from './decorator-factories.js';

import { KeyRegistry } from './key-registry.js';
import { Class, CTX_DATA, Dependency, getNewRegistry, Provider, ResolvedProvider } from './types-and-models.js';
import { stringify } from './utils.js';
import { fromSelf, inject, injectable, methodFactory, optional, skipSelf } from './decorators.js';
import { InjectionToken } from './injection-token.js';
import { Injector } from './injector.js';
import { forwardRef } from './forward-ref.js';
import { reflector } from './reflection.js';

class Engine {}


@injectable()
class Car {
  constructor(public engine: Engine) {}
}

@injectable()
class SportsCar extends Car {}

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
  fit('useFactory should works with methods keys as symbols', () => {
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
});