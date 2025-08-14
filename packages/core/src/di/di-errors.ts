import { inspect, format } from 'node:util';

import { newCustomError } from '#error/custom-error.js';
import { stringify } from '#di/utils.js';
import { AnyFn } from '#types/mix.js';
import { Class } from './types-and-models.js';
import { LevelOfInjector } from './injector.js';

export const diErrors = {
  /**
   * `Setting value by token failed: cannot find token "%s" in register, in providersPer%s.`
   */
  settingValueByTokenFailed(displayToken: string, level?: LevelOfInjector) {
    let msg1 = 'Setting value by token failed: cannot find token "%s" in register, in providersPer%s.';
    msg1 = format(msg1, displayToken, level);
    return newCustomError(diErrors.settingValueByTokenFailed, {
      msg1,
      level: 'fatal',
    });
  },
  /**
   * `Setting value by ID failed: cannot find ID "%d" in register, in providersPer%s. Try use injector.setByToken()`
   */
  settingValueByIdFailed(id: number, level?: LevelOfInjector) {
    let msg1 =
      'Setting value by ID failed: cannot find ID "%d" in register, in providersPer%s. Try use injector.setByToken()';
    msg1 = format(msg1, id, level);
    return newCustomError(diErrors.settingValueByIdFailed, {
      msg1,
      level: 'fatal',
    });
  },
  /**
   * `Cannot find method in "${className}".`
   */
  cannotFindMethodInClass(className: string) {
    return newCustomError(diErrors.cannotFindMethodInClass, {
      msg1: `Cannot find method in "${className}".`,
      level: 'fatal',
    });
  },
  /**
   * `Cannot find "${factory.name}()" as method in "${className}".`
   */
  cannotFindFactoryAsMethod(factoryName: string, className: string) {
    return newCustomError(diErrors.cannotFindFactoryAsMethod, {
      msg1: `Cannot find "${factoryName || 'anonymous'}()" as method in "${className}".`,
      level: 'fatal',
    });
  },
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
  mixMultiProvidersWithRegularProvidersError(token: NonNullable<unknown>) {
    const multiProvider = stringify(token);
    return newCustomError(diErrors.mixMultiProvidersWithRegularProvidersError, {
      msg1: `Cannot mix multi providers and regular providers for "${multiProvider}"`,
      level: 'fatal',
    });
  },
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
  noAnnotationError(Cls: Class, params: any[], propertyKey?: string | symbol) {
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
    return newCustomError(diErrors.noAnnotationError, {
      msg1,
      level: 'fatal',
    });
  },
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
  invalidProviderError(provider: any) {
    const obj = inspect(provider, false, 2);
    return newCustomError(diErrors.invalidProviderError, {
      msg1: `Invalid provider - only instances of Provider and Class are allowed, got: ${obj}`,
      level: 'fatal',
    });
  },
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
  instantiationError(originalException: any, tokens: any[]) {
    const first = stringify(tokens[0]);
    const action = first.includes('.prototype.') ? 'calling' : 'instantiation of';
    return newCustomError(
      diErrors.instantiationError,
      {
        msg1: `Failed ${action} ${first}!${constructResolvingPath(tokens)}`,
        level: 'fatal',
      },
      originalException,
    );
  },
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
  cyclicDependencyError(tokens: any[]) {
    return newCustomError(diErrors.cyclicDependencyError, {
      msg1: `Cannot instantiate cyclic dependency!${constructResolvingPath(tokens)}`,
      level: 'fatal',
    });
  },
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
  noProviderError(tokens: any[]) {
    const first = stringify(tokens[0]);
    return newCustomError(diErrors.noProviderError, {
      msg1: `No provider for ${first}!${constructResolvingPath(tokens)}`,
      level: 'fatal',
    });
  },
  /**
   * `Failed to create factory provider for ${stringify(token)}:
   * second argument in tuple of useFactory must be a function, got ${typeof factory}`
   */
  failedCreateFactoryProvider(token: string, factory: AnyFn) {
    return newCustomError(diErrors.failedCreateFactoryProvider, {
      msg1:
        `Failed to create factory provider for ${stringify(token)}:` +
        `second argument in tuple of useFactory must be a function, got ${typeof factory}`,
      level: 'warn',
    });
  },
};

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
