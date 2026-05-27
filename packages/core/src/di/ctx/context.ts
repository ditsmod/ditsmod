import { injectable } from '#di/decorators.js';
import { Injector } from '#di/injector.js';

@injectable()
export class Context {
  #ctx = new Map();
  #parent: Context | null;

  constructor(protected injector: Injector) {
    if (injector.parent) {
      this.#parent = injector.parent.get(Context, null, null);
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

  protected collectValues(mergedCtx = new Map(), stepsUp: number = -1): Map<string, Map<any, any>> {
    ++stepsUp;
    mergedCtx.set(this.injector.level || `steps up: ${stepsUp}`, new Map(this.#ctx));
    if (this.#parent) {
      return this.#parent.collectValues(mergedCtx, stepsUp);
    }
    return mergedCtx;
  }
}
