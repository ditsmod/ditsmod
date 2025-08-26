import { makeClassDecorator, makePropDecorator, makeParamDecorator } from './decorator-factories.js';

/**
 * Allows you to use an alternative token for a specific dependency.
 * 
 * ### Example
 *
```ts
class Engine {}

@injectable()
class Car {
  constructor(@inject('MyEngine') public engine: Engine) {}
}

const injector =
    Injector.resolveAndCreate([{token: 'MyEngine', useClass: Engine}, Car]);

expect(injector.get(Car).engine instanceof Engine).toBe(true);
```
  *
  * When `@inject()` is not present, `Injector` will use the type annotation of the
  * parameter.
  *
  * ### Example
  *
```ts
class Engine {}

@injectable()
class Car {
  constructor(public engine: Engine) {
  }  // same as constructor(@inject(Engine) engine:Engine)
}

const injector = Injector.resolveAndCreate([Engine, Car]);
expect(injector.get(Car).engine instanceof Engine).toBe(true);
```
   */
export const inject: InjectDecorator = makeParamDecorator(
  (token, ctx?) => ({ token, ctx }) satisfies InjectTransformResult,
);

export interface InjectDecorator {
  (token: NonNullable<unknown>): any;
  <T extends NonNullable<unknown>>(token: NonNullable<unknown>, ctx: T): any;
}

export interface InjectTransformResult {
  token: NonNullable<unknown>;
  ctx?: NonNullable<unknown>;
}

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
export const optional = makeParamDecorator(() => undefined);

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
export const injectable = makeClassDecorator(() => undefined);

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
export const fromSelf = makeParamDecorator(() => undefined);

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
export const skipSelf = makeParamDecorator(() => undefined);

/**
 * Used to mark methods in a class for `FactoryProvider`.
 */
export const factoryMethod = makePropDecorator(() => undefined);
