import { makeClassDecorator, makePropDecorator, makeParamDecorator } from './decorator-factories';

/**
  * ### Example
  *
```ts
class Engine {}

@injectable()
class Car {
  constructor(@inject('MyEngine') public engine: Engine) {}
}

const injector =
    ReflectiveInjector.resolveAndCreate([{token: 'MyEngine', useClass: Engine}, Car]);

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

const injector = ReflectiveInjector.resolveAndCreate([Engine, Car]);
expect(injector.get(Car).engine instanceof Engine).toBe(true);
```
   */
export const inject = makeParamDecorator((token: any) => (token));

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

const injector = ReflectiveInjector.resolveAndCreate([Car]);
expect(injector.get(Car).engine).toBeNull();
```
 */
export const optional = makeParamDecorator();

/**
 * ### Interface Overview
 *
```ts
interface InjectableDecorator {
  (): any
  new (): injectable
}
```
 *
 * ### Description
 *
 * A marker metadata that marks a class as available to `Injector` for creation.
 *
 * ### Example
 *
```ts
@injectable()
class Car {}
```
 *
 *
 * ### Example
 *
```ts
@injectable()
class UsefulService {
}

@injectable()
class NeedsService {
  constructor(public service: UsefulService) {}
}

const injector = ReflectiveInjector.resolveAndCreate([NeedsService, UsefulService]);
expect(injector.get(NeedsService).service instanceof UsefulService).toBe(true);
```
 *
 * `Injector` will throw an error when trying to instantiate a class that
 * does not have `@injectable` marker, as shown in the example below.
 *
```ts
class UsefulService {}

class NeedsService {
  constructor(public service: UsefulService) {}
}

expect(() => ReflectiveInjector.resolveAndCreate([NeedsService, UsefulService])).toThrow();
```
 */
export const injectable = makeClassDecorator();

/**
 * Specifies that an `Injector` should retrieve a dependency only from itself.
 *
 * ### Example
 *
```ts
@injectable()
class Car {
  constructor(@fromSelf() public engine:Engine) {}
}
```
 *
 *
 * ### Example
 *
```ts
class Dependency {}

@injectable()
class NeedsDependency {
  constructor(@fromSelf() public dependency: Dependency) {}
}

let inj = ReflectiveInjector.resolveAndCreate([Dependency, NeedsDependency]);
const nd = inj.get(NeedsDependency);

expect(nd.dependency instanceof Dependency).toBe(true);

inj = ReflectiveInjector.resolveAndCreate([Dependency]);
const child = inj.resolveAndCreateChild([NeedsDependency]);
expect(() => child.get(NeedsDependency)).toThrowError();
```
 */
export const fromSelf = makeParamDecorator();

/**
 * ### Description
 *
 * Specifies that the dependency resolution should start from the parent injector.
 *
 * ### Example
 *
```ts
@injectable()
class Car {
  constructor(@skipSelf() public engine:Engine) {}
}
  ```
 *
 *
 * ### Example
 *
```ts
class Dependency {}

@injectable()
class NeedsDependency {
  constructor(@skipSelf() public dependency: Dependency) { this.dependency = dependency; }
}

const parent = ReflectiveInjector.resolveAndCreate([Dependency]);
const child = parent.resolveAndCreateChild([NeedsDependency]);
expect(child.get(NeedsDependency).dependency instanceof Dependency).toBe(true);

const inj = ReflectiveInjector.resolveAndCreate([Dependency, NeedsDependency]);
expect(() => inj.get(NeedsDependency)).toThrowError();
```
 */
export const skipSelf = makeParamDecorator();

/**
 * Uses to mark methods in a class for FactoryProvider.
 */
export const methodFactory = makePropDecorator();
