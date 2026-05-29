import { forwardRef } from './forward-ref.js';
import { Reflector } from './reflector.js';

/**
 * A parameter decorator that allows you to specify an alternative token. It can operate in two modes:
 * 1. When taking one argument, DI creates a cache for the corresponding result.
 * 2. When taking two arguments, DI does not create or use a cache.
 * 
 * For more info, see the [documentation][1].
 * 
 * ### Example
 * 
 * ```ts
@injectable()
class Service2 {
  // Uses DI cache
  constructor(@inject('some-token') public service1: Service1) {}
}

// OR

@injectable()
class Service2 {
  // Does not use DI cache
  constructor(@inject('some-token', 'some-input') public service1: Service1) {}
}
 * ```
 *
 * [1]: http://ditsmod.github.io/en/basic-components/dependency-injection/#inject-and-input
 */
export const inject: InjectDecorator = Reflector.makeParamDecorator(
  (token, input?) => ({ token, input }) satisfies InjectTransformResult,
  'inject',
);

export interface InjectDecorator {
  (token: NonNullable<unknown>): any;
  <T extends NonNullable<unknown>>(token: NonNullable<unknown>, input: T): any;
}

export interface InjectTransformResult {
  token: NonNullable<unknown>;
  input?: NonNullable<unknown>;
}

/**
 * A parameter decorator that indicates to the DI injector that it needs to pass input data
 * that was passed during the `@inject(Service, 'some-data')` call (or its analogues).
 * 
 * For more info, see the [documentation][1].
 * 
 * ### Example
```ts
import { injectable, inject, input } from '@ditsmod/core';

@injectable()
class Dependecy1 {
  constructor(@input public inputData: string) { // Here input is 'some-data'
    // ...
  }
}

@injectable()
class Service1 {
  constructor(@inject(Dependecy1, 'some-data') dependecy1: Dependecy1) {}
}
```
 * 
 * [1]: http://ditsmod.github.io/en/basic-components/dependency-injection/#inject-and-input
 */
export const input = Reflector.makeParamDecorator(
  () => ({ token: forwardRef(() => input) }) satisfies InjectTransformResult,
  'input',
  inject,
)();

/**
 * A parameter metadata that marks a dependency as optional.
 * `Injector` provides `null` if the dependency is not found.
 *
 * ### Example
 *
```ts
class Engine {}

@injectable()
class Car {
  constructor(@optional() public engine: Engine) {}
}

const injector = Injector.resolveAndCreate([Car]);
expect(injector.get(Car).engine).toBeNull();
```
 */
export const optional = Reflector.makeParamDecorator(undefined, 'optional');

/**
 * A marker metadata that marks a class as available to `Injector` for creation.
 *
 * ### Example
 *
```ts
@injectable()
class Service1 {
}

@injectable()
class Service2 {
  constructor(public service1: Service1) {}
}

const injector = Injector.resolveAndCreate([Service2, Service1]);
const service2 = injector.get(Service2);
expect(service2.service1 instanceof Service1).toBe(true);
```
 *
 * `Injector` will throw an error when trying to instantiate a class that does have a dependecy and
 * does not have `@injectable` marker, as shown in the example below.
 *
```ts
class Service1 {}

class Service2 {
  constructor(public service1: Service1) {}
}

expect(() => Injector.resolveAndCreate([Service2, Service1])).toThrow();
```
 */
export const injectable = Reflector.makeClassDecorator(() => undefined);

/**
 * Specifies that an injector should retrieve a dependency only from itself (ignore parent injectors).
 *
 *
 * ### Example
 *
```ts
import { injectable, fromSelf, Injector } from '@ditsmod/core';

class Service1 {}

@injectable()
class Service2 {
  constructor(@fromSelf() public service1: Service1) {}
}

const parent = Injector.resolveAndCreate([Service1, Service2]);
const child = parent.resolveAndCreateChild([Service2]);

it('parent can create instance of Service2', () => {
  const service2 = parent.get(Service2) as Service2;
  expect(service2.service1).toBeInstanceOf(Service1);
});

it('child cannot create instance of Service2', () => {
  expect(() => child.get(Service2)).toThrow();
});
```
 */
export const fromSelf = Reflector.makeParamDecorator(undefined, 'fromSelf');

/**
 * ### Description
 *
 * Specifies that the dependency resolution should start from the parent injector.
 *
 *
 * ### Example
 *
```ts
import { injectable, skipSelf, Injector } from '@ditsmod/core';

class Service1 {}

@injectable()
class Service2 {
  constructor(@skipSelf() public service1: Service1) {}
}

const parent = Injector.resolveAndCreate([Service1, Service2]);
const child = parent.resolveAndCreateChild([Service2]);

it('the parent cannot instantiate Service2', () => {
  expect(() => parent.get(Service2)).toThrow();
});

it('the child can instantiate Service2', () => {
  const service2 = child.get(Service2) as Service2;
  expect(service2.service1).toBeInstanceOf(Service1);
});
```
 */
export const skipSelf = Reflector.makeParamDecorator(undefined, 'skipSelf');

/**
 * Used to mark methods in a class for `FactoryProvider`.
 */
export const factoryMethod = Reflector.makePropDecorator();
