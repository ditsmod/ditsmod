import { injectable, fromSelf as fromSelfFn } from '#di/decorators.js';
import { Injector } from '#di/injector.js';
import type { getSymbol, InjectionSymbol } from './get-symbol.js';

/**
 * A service for storing specific context data at each level of the injector hierarchy. Additionally, it powers the `@ctx()` parameter decorator.
 * 
 * It is recommended to use the {@link getSymbol | getSymbol\<T\>()} function for context keys, which enables passing a type parameter:
 * 
 * ### Example
 * 
```ts
import { Context, getSymbol, Injector } from '@ditsmod/core';

export interface InterfaceOfSomeValue {
  one: string;
  two: number;
}

export const SOME_KEY = getSymbol<InterfaceOfSomeValue>('SOME_KEY');

// Testing
const injector = Injector.resolveAndCreate([Context]);
const ctx = injector.get(Context);
const value = ctx.get(SOME_KEY); // TypeScript infers the type as "InterfaceOfSomeValue | undefined"
```
 */
@injectable()
export class Context {
  #ctx = {} as { [key: string | symbol]: any };
  #parent: Context | undefined;

  constructor(protected injector: Injector) {
    if (injector.parent) {
      this.#parent = injector.parent.get(Context, null);
    }
  }

  /**
   * Indicates whether a value exists for the specified `key` in current context.
   */
  has(key: string | symbol | InjectionSymbol): boolean {
    return Object.hasOwn(this.#ctx, key as string);
  }

  /**
   * Sets the value in the current context for the specified `key`.
   */
  set<T = unknown>(key: InjectionSymbol<T>, value: T): this;
  set<T = unknown>(key: string | symbol | InjectionSymbol, value: T): this;
  set<T = unknown>(key: string | symbol | InjectionSymbol, value: T) {
    this.#ctx[key as string] = value;
    return this;
  }

  /**
   * Searches and returns the value for the specified `key` in current context.
   */
  get<T = unknown>(key: InjectionSymbol<T>): T | undefined;
  get<T = unknown>(key: string | symbol | InjectionSymbol): T | undefined;
  get(key?: any): any {
    return this.#ctx[key];
  }

  /**
   * Indicates whether a value exists for the specified `key`. The search for values
   * is done from bottom to top in the injector hierarchy.
   */
  hasInScope(key: string | symbol | InjectionSymbol): boolean | undefined {
    return Object.hasOwn(this.#ctx, key as string) || (this.#parent && this.#parent.hasInScope(key));
  }

  /**
   * Returns all key-value pairs found up the injector hierarchy.
   */
  getInScope(): Map<string, Map<any, any>>;
  /**
   * Searches and returns the value for the specified `key` from bottom to top in the injector hierarchy.
   */
  getInScope<T = unknown>(key: InjectionSymbol<T>): T | undefined;
  getInScope<T = unknown>(key: string | symbol | InjectionSymbol): T | undefined;
  getInScope(key?: any): any {
    if (key === undefined) {
      return this.collectValues();
    }
    if (Object.hasOwn(this.#ctx, key)) {
      return this.#ctx[key as string];
    } else if (this.#parent) {
      return this.#parent.getInScope(key);
    }
  }

  /**
   * Extracts values from the current context for the specified keys, and inserts them into
   * the context of the external injector.
   *
   * _Note: At the time of creation, this method was intended to enable guards at the module level,
   * specifically to pass contextual values to their injector at the request level. In this case,
   * the injectors for the guards are considered external in relation to the injectors of the
   * module they protect._
   */
  fill(externalInj: Injector, keys: (string | symbol | InjectionSymbol)[]) {
    const ctx = externalInj.get(Context, undefined, undefined, fromSelfFn) as Context;
    for (const key of keys) {
      ctx.set(key, this.#ctx[key as string]);
    }
  }

  protected collectValues(mergedCtx = new Map(), stepsUp: number = -1): Map<string, Map<any, any>> {
    ++stepsUp;
    mergedCtx.set(this.injector.level || `steps up: ${stepsUp}`, { ...this.#ctx });
    if (this.#parent) {
      return this.#parent.collectValues(mergedCtx, stepsUp);
    }
    return mergedCtx;
  }
}
