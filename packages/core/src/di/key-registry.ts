import { resolveForwardRef } from './forward-ref.js';
import { InjectionToken } from './injection-token.js';

/**
 * A unique object used for retrieving items from the `Injector`.
 *
 * Keys have:
 * - a system-wide unique `id`.
 * - a `token`.
 *
 * `DualKey` is used internally by `Injector` because its system-wide unique `id` allows
 * the injector to store created objects in a more efficient way.
 *
 * `DualKey` should not be created directly. `Injector` creates keys automatically when
 * resolving
 * providers.
 */
export class DualKey {
  constructor(
    public token: any,
    public id: number,
  ) {}
}

/**
 * This class is used to automatically create an extension group, which should run before group token.
 */
export class BeforeToken<T = any> extends InjectionToken<T> {
  readonly isBeforeToken = true as const;
}

// @todo After the reinit application, check for memory leaks.
export class KeyRegistry {
  static #allKeys = new Map<any, DualKey>();
  static #groupTokens = new Map<InjectionToken, BeforeToken>();
  static #groupDebugKeys = new Map<string, number>();
  static #paramTokens = new Map<any, { index: number; mapTokens: Map<any, InjectionToken> }>();

  /**
   * Retrieves a `DualKey` for a token.
   */
  static get(token: any): DualKey {
    token = resolveForwardRef(token);

    const value = this.#allKeys.get(token);
    if (value || this.#allKeys.has(token)) {
      return value!;
    }

    if (!token) {
      throw new TypeError('Token must be defined!');
    }
    const newKey = new DualKey(token, this.numberOfKeys);
    this.#allKeys.set(token, newKey);
    return newKey;
  }

  /**
   * @returns the number of keys registered in the system.
   */
  static get numberOfKeys(): number {
    return this.#allKeys.size;
  }

  /**
   * Generates a unique token for `groupToken`. This token is used to automatically
   * create an extension group, which should run before `groupToken`.
   */
  static getBeforeToken(groupToken: InjectionToken): BeforeToken {
    const beforeGroupToken = this.#groupTokens.get(groupToken);
    if (beforeGroupToken) {
      return beforeGroupToken;
    }

    if (!(groupToken instanceof InjectionToken)) {
      throw new TypeError('groupToken must be instance of InjectionToken!');
    }
    const groupDebugKey = groupToken.toString();
    const count = this.#groupDebugKeys.get(groupDebugKey);
    let newBeforeGroupToken: BeforeToken;
    if (count) {
      newBeforeGroupToken = new BeforeToken(`BEFORE ${groupDebugKey}-${count + 1}`);
      this.#groupDebugKeys.set(groupDebugKey, count + 1);
    } else {
      newBeforeGroupToken = new BeforeToken(`BEFORE ${groupDebugKey}`);
      this.#groupDebugKeys.set(groupDebugKey, 1);
    }
    this.#groupTokens.set(groupToken, newBeforeGroupToken);
    return newBeforeGroupToken;
  }

  /**
   * This method is needed to get a unique key from two keys. This is necessary
   * so that `@Inject()` (decorator for parameters) can accept a specific context in addition to
   * the token: `@Inject(SOME_TOKEN, 'certain contextual data')`. The arguments received by
   * `@Inject()` will be passed to the `getParamToken()` method to obtain a unique token for
   * further use by the `Injector`.
   */
  static getParamToken(token: NonNullable<unknown>, ctx: NonNullable<unknown>) {
    if (token == null || ctx == null) {
      throw new TypeError('Token and context must not be nullable.');
    }
    const obj = this.#paramTokens.get(token);
    if (obj) {
      const { index, mapTokens } = obj;
      let PARAM_TOKEN = mapTokens.get(ctx);
      if (!PARAM_TOKEN) {
        const id = `${index}-${mapTokens.size + 1}`;
        PARAM_TOKEN = new InjectionToken(`PARAM_TOKEN-${id}`);
        mapTokens.set(ctx, PARAM_TOKEN);
      }
      return PARAM_TOKEN;
    } else {
      const index = this.#paramTokens.size + 1;
      const PARAM_TOKEN = new InjectionToken(`PARAM_TOKEN-${index}-1`);
      const mapTokens = new Map([[ctx, PARAM_TOKEN]]);
      this.#paramTokens.set(token, { index, mapTokens });
      return PARAM_TOKEN;
    }
  }
}
