import { injectable } from '#di/decorators.js';
import { Injector } from '#di/injector.js';

@injectable()
export class Context {
  #ctx = new Map();
  #parent: Context | null;

  constructor(protected injector: Injector) {
    if (injector.parent) {
      this.#parent = injector.parent.get(Context, null);
    }
  }

  set(token: NonNullable<unknown>, value: any) {
    this.#ctx.set(token, value);
    return this;
  }

  has(token: NonNullable<unknown>) {
    return this.#ctx.has(token);
  }

  get(): Map<string, Map<any, any>>;
  get(token: any): unknown;
  get(token?: any): any {
    if (token === undefined) {
      return this.collectValues();
    }
    if (this.#ctx.has(token)) {
      return this.#ctx.get(token);
    } else if (this.#parent) {
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
    const ctx = externalInj.get(Context) as Context;
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
