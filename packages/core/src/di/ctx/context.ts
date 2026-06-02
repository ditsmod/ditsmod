import { fromSelf, injectable } from '#di/decorators.js';
import { Injector } from '#di/injector.js';
import type { InjectionSymbol } from './get-symbol.js';

@injectable()
export class Context {
  #ctx = new Map();
  #parent: Context | undefined;

  constructor(protected injector: Injector) {
    if (injector.parent) {
      this.#parent = injector.parent.get(Context, null);
    }
  }

  /**
   * Sets the value in the current context for the specified `key`.
   */
  set<T = unknown>(key: InjectionSymbol<T>, value: T): this;
  set<T = unknown>(key: string | symbol | InjectionSymbol, value: T): this;
  set<T = unknown>(key: string | symbol | InjectionSymbol, value: T) {
    this.#ctx.set(key, value);
    return this;
  }

  /**
   * Indicates whether a value exists for the specified `key`. The search for values
   * is done from bottom to top in the injector hierarchy.
   */
  has(key: NonNullable<unknown>, fromSelf?: boolean): boolean | undefined {
    if (fromSelf) {
      return this.#ctx.has(key);
    }
    return this.#ctx.has(key) || (this.#parent && this.#parent.has(key));
  }

  /**
   * Returns all key-value pairs found up the injector hierarchy.
   */
  get(): Map<string, Map<any, any>>;
  /**
   * Searches and returns the value for the specified `key` from bottom to top in the injector hierarchy.
   *
   * @param fromSelf If `true`, the lookup for values will only occur in the current context,
   * without ascending to parent injectors.
   */
  get<T = unknown>(key: InjectionSymbol<T>, fromSelf?: boolean): T | undefined;
  get<T = unknown>(key: string | symbol | InjectionSymbol, fromSelf?: boolean): T | undefined;
  get(key?: any, fromSelf?: boolean): any {
    if (key === undefined) {
      return this.collectValues();
    }
    if (this.#ctx.has(key)) {
      return this.#ctx.get(key);
    } else if (!fromSelf && this.#parent) {
      return this.#parent.get(key);
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
    const ctx = externalInj.get(Context, undefined, undefined, fromSelf) as Context;
    for (const key of keys) {
      ctx.set(key, this.#ctx.get(key));
    }
  }

  protected collectValues(mergedCtx = new Map(), stepsUp: number = -1): Map<string, Map<any, any>> {
    ++stepsUp;
    mergedCtx.set(this.injector.level || `steps up: ${stepsUp}`, new Map(this.#ctx));
    if (this.#parent) {
      return this.#parent.collectValues(mergedCtx, stepsUp);
    }
    return mergedCtx;
  }
}
