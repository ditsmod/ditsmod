import { inspect } from 'node:util';
import { Class, DiError } from './types-and-models.js';
import { stringify } from './utils.js';

function findFirstClosedCycle(tokens: any[]): any[] {
  const res: any[] = [];
  for (let i = 0; i < tokens.length; ++i) {
    if (res.indexOf(tokens[i]) !== -1) {
      res.push(tokens[i]);
      return res;
    }
    res.push(tokens[i]);
  }
  return res;
}

function constructResolvingPath(tokens: any[]): string {
  if (tokens.length > 1) {
    const reversed = findFirstClosedCycle(tokens.slice().reverse());
    const tokenStrs = reversed.map((token) => stringify(token));
    return ' (' + tokenStrs.join(' -> ') + ')';
  }

  return '';
}

/**
 * Thrown when trying to retrieve a dependency by key from `Injector`, but the
 * `Injector` does not have a `Provider` for the given key.
 *
 * ### Example
 *
```ts
@injectable()
class A {
  constructor(b:B) {}
}

expect(() => Injector.resolveAndCreate([A])).toThrow();
```
 */
export function noProviderError(tokens: any[]) {
  const first = stringify(tokens[0]);
  const error = new DiError(`No provider for ${first}!${constructResolvingPath(tokens)}`);
  return error;
}

/**
 * Thrown when dependencies form a cycle.
 *
 * ### Example
 *
```ts
@injectable()
class A {
  constructor(b: B) {}
}

@injectable()
class B {
  constructor(a: A) {}
}
```
 *
 * Retrieving `A` or `B` throws a `CyclicDependencyError` as the graph above cannot be constructed.
 */
export function cyclicDependencyError(tokens: any[]) {
  const error = new DiError(`Cannot instantiate cyclic dependency!${constructResolvingPath(tokens)}`);
  return error;
}

/**
 * Thrown when a constructing type returns with an Error.
 *
 * The `InstantiationError` class contains the original error plus the dependency graph which caused
 * this object to be instantiated.
 *
 * ### Example
 *
```ts
class A {
  constructor() {
    throw new Error('message');
  }
}

let injector = Injector.resolveAndCreate([A]);

try {
  injector.get(A);
} catch (e) {
  expect(e instanceof InstantiationError).toBe(true);
  expect(e.originalException.message).toEqual("message");
  expect(e.originalStack).toBeDefined();
}
```
 */
export function instantiationError(originalException: any, tokens: any[]) {
  const first = stringify(tokens[0]);
  const action = first.includes('.prototype.') ? 'calling' : 'instantiation of';
  originalException.message = `${
    originalException.message
  }; this error during ${action} ${first}!${constructResolvingPath(tokens)}`;
  return originalException;
}

/**
 * Thrown when an object other then `Provider` (or `Class`) is passed to `Injector`
 * creation.
 *
 * ### Example
 *
```ts
expect(() => Injector.resolveAndCreate(["not a type"])).toThrow();
```
 */
export function invalidProviderError(provider: any) {
  const obj = inspect(provider, false, 2);
  return new DiError(`Invalid provider - only instances of Provider and Class are allowed, got: ${obj}`);
}

/**
 * Thrown when the class has no annotation information.
 *
 * Lack of annotation information prevents the `Injector` from determining which dependencies
 * need to be injected into the constructor.
 *
 * ### Example
 *
```ts
class A {
  constructor(b) {}
}

expect(() => Injector.resolveAndCreate([A])).toThrow();
```
 *
 * This error is also thrown when the class not marked with `injectable` has parameter types.
 *
```ts
class B {}

class A {
  constructor(b:B) {} // no information about the parameter types of A is available at runtime.
}

expect(() => Injector.resolveAndCreate([A,B])).toThrow();
```
 */
export function noAnnotationError(Cls: Class, params: any[], propertyKey?: string | symbol): DiError {
  const signature = getSignature(params);
  if (propertyKey) {
    const path = `${stringify(Cls)}.${propertyKey.toString()}`;
    return new DiError(
      `Cannot resolve all parameters for '${path}(${signature.join(', ')})'. ` +
        'Make sure that all the parameters are decorated with inject or have valid type annotations' +
        ` and that '${path}()' is decorated with some property decorator.`,
    );
  }
  return new DiError(
    `Cannot resolve all parameters for '${stringify(Cls)}(${signature.join(', ')})'. ` +
      'Make sure that all the parameters are decorated with inject or have valid type annotations' +
      ` and that '${stringify(Cls)}' is decorated with some class decorator.`,
  );
}

function getSignature(params: any[]) {
  const signature: string[] = [];
  for (let i = 0, ii = params.length; i < ii; i++) {
    const parameter = params[i];
    if (!parameter || parameter.length == 0) {
      signature.push('?');
    } else {
      signature.push(parameter.map(stringify).join(' '));
    }
  }
  return signature;
}

/**
 * Thrown when a multi provider and a regular provider are bound to the same token.
 *
 * ### Example
 *
```ts
expect(() => Injector.resolveAndCreate([
  { provide: "Strings", useValue: "string1", multi: true},
  { provide: "Strings", useValue: "string2", multi: false}
])).toThrow();
```
 */
export function mixMultiProvidersWithRegularProvidersError(token: NonNullable<unknown>): DiError {
  const multiProvider = stringify(token);
  const msg = `Cannot mix multi providers and regular providers for "${multiProvider}"`;
  return new DiError(msg);
}
