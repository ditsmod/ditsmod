import type { DualKey } from '#di/key-registry.js';
import type { MultiProvider } from '#di/utils.js';
import type { AnyFn, Visibility } from './types-and-models.js';

/**
 * This ID is used (instead `instanceof ResolvedProvider`) to quickly identify the type of values that the DI registry contains.
 *
 */
export const ID = Symbol();
/**
 * An internal resolved representation of a `Provider` used by the `Injector`.
 *
 * It is usually created automatically by `Injector.resolveAndCreate`.
 *
 * It can be created manually, as follows:
 *
 * ### Example
 *
```ts
let resolvedProviders = Injector.resolve([{ token: 'message', useValue: 'Hello' }]);
let injector = Injector.fromResolvedProviders(resolvedProviders);

expect(injector.get('message')).toEqual('Hello');
```
 *
 */

export class ResolvedProvider {
  [ID] = true;
  constructor(
    public dualKey: DualKey,
    public resolvedFactories: ResolvedFactory[],
    public multi: boolean
  ) { }
}

export class RegistryOfInjector {
  [id: number]: ResolvedProvider;
}
/**
 * Returns new class with `RegistryOfInjector` interface.
 */

export function getNewRegistry(): typeof RegistryOfInjector {
  return class NewRegistryOfInjector {
    /**
     * This ID taken from `resolvedProvider.dualKey.id`.
     */
    [id: number]: ResolvedProvider;
  };
}
/**
 * An internal resolved representation of a factory function created by resolving `Provider`.
 */

export class ResolvedFactory {
  declare provider?: MultiProvider;

  constructor(
    /**
     * Factory function which can return an instance of an object represented by a key.
     */
    public factory: AnyFn,

    /**
     * Arguments (dependencies) to the `factory` function.
     */
    public dependencies: Dependency[],
    provider?: MultiProvider
  ) {
    if (provider) {
      this.provider = provider;
    }
  }
}

/**
 * This is internal and should not be used directly.
 */
export class Dependency {
  constructor(
    public dualKey: DualKey,
    public optional: boolean,
    public visibility: Visibility,
    public input?: NonNullable<unknown>
  ) { }

  static fromDualKey(dualKey: DualKey, input?: NonNullable<unknown>): Dependency {
    return new Dependency(dualKey, false, null, input);
  }
}

