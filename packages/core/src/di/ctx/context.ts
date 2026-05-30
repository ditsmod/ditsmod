import { fromSelf, injectable } from '#di/decorators.js';
import { Injector } from '#di/injector.js';

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
   * Sets the value in the current context for the specified `token`.
   */
  set(token: NonNullable<unknown>, value: any) {
    this.#ctx.set(token, value);
    return this;
  }

  /**
   * Indicates whether a value exists for the specified `token`. The search for values
   * is done from bottom to top in the injector hierarchy.
   */
  has(token: NonNullable<unknown>, fromSelf?: boolean): boolean | undefined {
    if (fromSelf) {
      return this.#ctx.has(token);
    }
    return this.#ctx.has(token) || (this.#parent && this.#parent.has(token));
  }

  /**
   * Returns all key-value pairs found up the injector hierarchy.
   */
  get(): Map<string, Map<any, any>>;
  /**
   * Searches and returns the value for the specified `token` from bottom to top in the injector hierarchy.
   *
   * @param fromSelf If `true`, the lookup for values will only occur in the current context,
   * without ascending to parent injectors.
   */
  get(token: any, fromSelf?: boolean): unknown | undefined;
  get(token?: any, fromSelf?: boolean): any {
    if (token === undefined) {
      return this.collectValues();
    }
    if (this.#ctx.has(token)) {
      return this.#ctx.get(token);
    } else if (!fromSelf && this.#parent) {
      return this.#parent.get(token);
    }
  }

  /**
   * Extracts values from the current context for the specified tokens, and inserts them into
   * the context of the external injector.
   *
   * _Note: At the time of creation, this method was intended to enable guards at the module level,
   * specifically to pass contextual values to their injector at the request level. In this case,
   * the injectors for the guards are considered external in relation to the injectors of the
   * module they protect._
   */
  fill(externalInj: Injector, tokens: any[]) {
    const ctx = externalInj.get(Context, undefined, undefined, fromSelf) as Context;
    for (const token of tokens) {
      ctx.set(token, this.#ctx.get(token));
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
