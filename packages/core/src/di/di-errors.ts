import { inspect } from 'node:util';

import { CustomError } from '#error/custom-error.js';
import { stringify } from '#di/stringify.js';
import { Class } from './types-and-models.js';
import { LevelOfInjector } from './injector.js';

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
export class NoProvider extends CustomError {
  constructor(tokens: any[]) {
    const first = stringify(tokens[0]);
    super({
      msg1: `No provider for ${first}!${constructResolvingPath(tokens)}`,
      level: 'fatal',
    });
  }
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
export class InstantiationError extends CustomError {
  constructor(originalException: any, tokens: any[]) {
    const first = stringify(tokens[0]);
    const action = first.includes('.prototype.') ? 'calling' : 'instantiation of';
    super(
      {
        msg1: `Failed ${action} ${first}${constructResolvingPath(tokens)}`,
        level: 'fatal',
      },
      originalException,
    );
  }
}
/**
 * `Token must be defined!`
 */
export class TokenMustBeDefined extends CustomError {
  constructor() {
    super({
      msg1: 'Token must be defined!',
      level: 'fatal',
    });
  }
}
/**
 * `The injector is trying to set a value by token but cannot find "${displayToken}" in the registry, in providersPer${level}.`
 */
export class SettingValueByTokenFailed extends CustomError {
  constructor(displayToken: string, level?: LevelOfInjector) {
    super({
      msg1: `The injector is trying to set a value by token but cannot find "${displayToken}" in the registry, in providersPer${level}.`,
      level: 'fatal',
    });
  }
}
/**
 * `The injector is trying to set a value by ID but cannot find "${id}" in the registry, in providersPer${level}.`
 */
export class SettingValueByIdFailed extends CustomError {
  constructor(id: number, level?: LevelOfInjector) {
    super({
      msg1: `The injector is trying to set a value by ID but cannot find "${id}" in the registry, in providersPer${level}.`,
      level: 'fatal',
    });
  }
}
/**
 * `Cannot find method in "${className}".`
 */
export class CannotFindMethodInClass extends CustomError {
  constructor(className: string) {
    super({
      msg1: `Cannot find method in "${className}".`,
      level: 'fatal',
    });
  }
}
/**
 * `Cannot find "${factory.name}()" as method in "${className}".`
 */
export class CannotFindFactoryAsMethod extends CustomError {
  constructor(factoryName: string, className: string) {
    super({
      msg1: `Cannot find "${factoryName || 'anonymous'}()" as method in "${className}".`,
      level: 'fatal',
    });
  }
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
export class MixMultiWithRegularProviders extends CustomError {
  constructor(token: NonNullable<unknown>) {
    const multiProvider = stringify(token);
    super({
      msg1: `Cannot mix multi providers and regular providers for "${multiProvider}"`,
      level: 'fatal',
    });
  }
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
export class NoAnnotation extends CustomError {
  constructor(Cls: Class, params: any[], propertyKey?: string | symbol) {
    let msg1: string;
    const signature = getSignature(params);
    if (propertyKey) {
      const path = `${stringify(Cls)}.${propertyKey.toString()}`;
      msg1 =
        `Cannot resolve all parameters for '${path}(${signature.join(', ')})'. ` +
        'Make sure that all the parameters are decorated with inject or have valid type annotations' +
        ` and that '${path}()' is decorated with some property decorator.`;
    } else {
      msg1 =
        `Cannot resolve all parameters for '${stringify(Cls)}(${signature.join(', ')})'. ` +
        'Make sure that all the parameters are decorated with inject or have valid type annotations' +
        ` and that '${stringify(Cls)}' is decorated with some class decorator.`;
    }
    super({
      msg1,
      level: 'fatal',
    });
  }
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
export class InvalidProvider extends CustomError {
  constructor(provider: any) {
    const obj = inspect(provider, false, 2);
    super({
      msg1: `Invalid provider - only instances of Provider and Class are allowed, got: ${obj}`,
      level: 'fatal',
    });
  }
}
/**
   * `Cannot instantiate cyclic dependency!${constructResolvingPath(tokens)}`
   * 
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
export class CyclicDependency extends CustomError {
  constructor(tokens: any[]) {
    super({
      msg1: `Cannot instantiate cyclic dependency!${constructResolvingPath(tokens)}`,
      level: 'fatal',
    });
  }
}
/**
 * `Failed to create factory provider for ${stringify(token)}:
 * second argument in tuple of useFactory must be a function, got ${factoryType}`
 */
export class FailedCreateFactoryProvider extends CustomError {
  constructor(token: string, factoryType: string) {
    super({
      msg1:
        `Failed to create factory provider for ${stringify(token)}:` +
        `second argument in tuple of useFactory must be a function, got ${factoryType}`,
      level: 'warn',
    });
  }
}

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
