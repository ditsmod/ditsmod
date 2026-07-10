import type { fromSelf, skipSelf } from '../decorators.js';
import type { ForwardRefFn } from '../forward-ref.js';
import type { InjectionToken } from './injection-token.js';
import type { DecoratorMeta } from './decorator-and-value.js';
import type { DepsMeta } from './resolved-provider.js';
import { DEPS_KEY } from './constants.js';

export type Class<T = any, A extends any[] = any> = (new (...args: A) => T) & { prototype: T };
export type AbstractClass<T = any, A extends any[]= any> = (abstract new (...args: A) => T) & { prototype: T };

export type PropMetadataTuple<Value = any> = [Class, ...DecoratorMeta<Value>[]];

/**
 * Used to indicate the unknown data type of a particular
 * class property returned by `Reflector`.
 */
export class UnknownType {}

/**
 * Metadata returned by the `Reflector.collectMeta()` method.
 */
export type ClassMeta<DecorValue = any, Proto extends object = object> = {
  [P in keyof Proto]: ClassPropMeta<DecorValue>;
} & { constructor: ClassPropMeta<DecorValue> } & { [Symbol.iterator]: () => Generator<string | symbol> };

export class ClassPropMeta<DecorValue = any> {
  [DEPS_KEY]?: DepsMeta;

  constructor(
    public type: Class = UnknownType,
    public decorators: DecoratorMeta<DecorValue>[] = [],
    public params: (ParameterMeta | null)[] = [],
  ) {}
}

/**
 * Metadata returned by the `Reflector.collectMeta()` method.
 */
export type MergedClassMeta<DecorValue = any, Proto extends object = object> = {
  [P in keyof Proto]: MergedClassPropMeta<DecorValue>;
} & { constructor: MergedClassPropMeta<DecorValue> } & { [Symbol.iterator]: () => Generator<string | symbol> };

export class MergedClassPropMeta<DecorValue = any> extends ClassPropMeta<DecorValue> {
  constructor(
    type: Class = UnknownType,
    decorators: DecoratorMeta<DecorValue>[] = [],
    params: (ParameterMeta | null)[] = [],
    public decoratorChain: Map<Class, DecoratorMeta<DecorValue>[]> = new Map(),
    public paramChain: Map<Class, (ParameterMeta | null)[]> = new Map(),
  ) {
    super(type, decorators, params);
  }
}

export type ParameterItem<Value = any> = DecoratorMeta<Value> | InjectionToken<any> | Class;
export type ParameterMeta<Value = any> = [Class, ...ParameterItem<Value>[]] | [...ParameterItem<Value>[]] | [];

export type Visibility = typeof fromSelf | typeof skipSelf | null;

export type NormalizedProvider = ValueProvider | ClassProvider | TokenProvider | FactoryProvider;

/**
 * ### Interface Overview
 *
```ts
interface TypeProvider extends Class {
}
```
 *
 * Configures the `Injector` to return an instance of `Class` when `Class` is used  as token.
 *
 * ### Example
 *
```ts
@injectable()
class MyService {}

const provider: TypeProvider = MyService;
```
 *
 * ### Description
 *
 * Create an instance by invoking the `new` operator and supplying additional arguments.
 * This form is a short form of `TypeProvider`;
 *
 * ### Example
 *
```ts
@injectable()
class Greeting {
  salutation = 'Hello';
}

const injector = Injector.resolveAndCreate([
  Greeting,  // Shorthand for { token: Greeting, useClass: Greeting }
]);

expect(injector.get(Greeting).salutation).toBe('Hello');
```
 */
export type TypeProvider = Class;

export interface BaseNormalizedProvider {
  /**
   * An injection token. (Typically an instance of `Class` or `InjectionToken`, but can be `any`).
   */
  token?: any;

  /**
   * If true, then injector returns an array of instances. This is useful to allow multiple
   * providers spread across many files to token configuration information to a common token.
   *
   * ### Example
   *
```ts
const injector = Injector.resolveAndCreate([
  {token: 'local', multi: true, useValue: 'en'},
  {token: 'local', multi: true, useValue: 'sk'},
]);

const locales: string[] = injector.get('local');
expect(locales).toEqual(['en', 'sk']);
```
   */
  multi?: boolean;
}

/**
 * ### Interface Overview
 *
```ts
interface ValueProvider {
  token: NonNullable<unknown>
  useValue: any
  multi?: boolean
}
```
 * Configures the `Injector` to return a value for a token.
 *
 * ### How To Use
 *
```ts
const provider: ValueProvider = {token: 'someToken', useValue: 'someValue'};
```
 *
 *
 * ### Example
 *
```ts
const injector =
    Injector.resolveAndCreate([{token: String, useValue: 'Hello'}]);

expect(injector.get(String)).toEqual('Hello');
```
 */
export interface ValueProvider<T = any> extends BaseNormalizedProvider {
  token: NonNullable<unknown>;
  /**
   * The value to inject.
   */
  useValue?: T;
}

/**
 * ### Interface Overview
 *
```ts
interface ClassProvider {
  token: NonNullable<unknown>
  useClass: Class
  multi?: boolean
}
```
 * Configures the `Injector` to return an instance of `useClass` for a token.
 *
 * ### Example
 *
```ts
@injectable()
class MyService {}

const provider: ClassProvider = {token: 'someToken', useClass: MyService};
```
 *
 *
 * ### Example
 *
```ts
abstract class Shape { name: string; }

class Square extends Shape {
  name = 'square';
}

const injector = Injector.resolveAndCreate([{token: Shape, useClass: Square}]);

const shape: Shape = injector.get(Shape);
expect(shape.name).toEqual('square');
expect(shape instanceof Square).toBe(true);
```
 *
 * Note that following two providers are not equal:
 *
```ts
class Greeting {
  salutation = 'Hello';
}

class FormalGreeting extends Greeting {
  salutation = 'Greetings';
}

const injector = Injector.resolveAndCreate(
    [FormalGreeting, {token: Greeting, useClass: FormalGreeting}]);

// The injector returns different instances.
// See: {token: ?, useToken: ?} if you want the same instance.
expect(injector.get(FormalGreeting)).not.toBe(injector.get(Greeting));
```
 */
export interface ClassProvider extends BaseNormalizedProvider {
  token: NonNullable<unknown>;

  /**
   * Class to instantiate for the `token`.
   */
  useClass: Class | ForwardRefFn<Class>;
}

/**
 * ### Interface Overview
 *
```ts
interface TokenProvider {
  token: NonNullable<unknown>
  useToken: any
  multi?: boolean
}
```
 * Configures the `Injector` to return a value of another `useToken` token.
 *
 * ### Example
 *
```ts
const provider: TokenProvider = {token: 'someToken', useToken: 'someOtherToken'};
```
 *
 *
 * ### Example
 *
```ts
class Greeting {
  salutation = 'Hello';
}

class FormalGreeting extends Greeting {
  salutation = 'Greetings';
}

const injector = Injector.resolveAndCreate(
    [FormalGreeting, {token: Greeting, useToken: FormalGreeting}]);

expect(injector.get(Greeting).salutation).toEqual('Greetings');
expect(injector.get(FormalGreeting).salutation).toEqual('Greetings');
expect(injector.get(FormalGreeting)).toBe(injector.get(Greeting));
```
 */
export interface TokenProvider extends BaseNormalizedProvider {
  token: NonNullable<unknown>;

  /**
   * Pointing to other `token` to return its value. Equivalent to `injector.get(useToken)`.
   */
  useToken: any;
}

/**
 * Configures the `Injector` to return a value by invoking a class method.
 *
 * ### Example
 *
```ts
import { factoryMethod } from '@ditsmod/core';

const Location = new InjectionToken('location');
const Hash = new InjectionToken('hash');

export class ClassWithFactory {
  @factoryMethod()
  method1(@optional() location: Location) {
    return `Hash for: ${location}`;
  }
}

const injector = Injector.resolveAndCreate([
  { token: Hash, useFactory: [ClassWithFactory, ClassWithFactory.prototype.method1]
}]);

expect(injector.get(Hash)).toEqual('Hash for: null');
```
 */
export type FactoryProvider = FunctionFactoryProvider | ClassFactoryProvider;

export interface FunctionFactoryProvider extends BaseNormalizedProvider {
  /**
   * A function to invoke to create a value for this `token`.
   * The function is invoked with resolved values of `token`s in the `deps` field.
   */
  useFactory: AnyFn;
  /**
   * An array of dependency tokens whose corresponding values need
   * to be passed into the {@link useFactory} function.
   */
  deps?: any[];
}

export interface ClassFactoryProvider extends BaseNormalizedProvider {
  /**
   * The tuple, where the class comes first, and the method of this class comes second:
   * `useFactory: [Class, Class.prototype.someMethod]`.
   *
   * The method uses to invoke to create a value for `token`. The method is invoked with
   * resolved values of its parameters.
   */
  useFactory: UseFactoryTuple;
  deps?: never;
}

export type UseFactoryTuple = [Class, AnyFn];

/**
 * Describes how the `Injector` should be configured.
 *
 * ### How To Use
 * See `TypeProvider`, `ValueProvider`, `ClassProvider`, `TokenProvider`, `FactoryProvider`.
 */
export type Provider = TypeProvider | ValueProvider | ClassProvider | TokenProvider | FactoryProvider;
export type AnyFn<Args extends any[] = any[], Return = any> = (...args: Args) => Return;
export interface TypeGuard<T> {
  (arg: any): arg is T;
}
export type CompareFn<T = any> = (a: T, b: T) => number;
