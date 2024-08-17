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

export class GroupInjectionToken<T = any> extends InjectionToken<T> {
  readonly isBeforeToken = true as const;
}

export class KeyRegistry {
  static #allKeys = new Map<any, DualKey>();
  static #groupTokens = new Map<InjectionToken, GroupInjectionToken>();
  static #groupDebugKeys = new Map<string, number>();

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
  static getBeforeToken(groupToken: InjectionToken): GroupInjectionToken {
    const beforeGroupToken = this.#groupTokens.get(groupToken);
    if (beforeGroupToken) {
      return beforeGroupToken;
    }

    if (!(groupToken instanceof InjectionToken)) {
      throw new TypeError('groupToken must be instance of InjectionToken!');
    }
    const groupDebugKey = groupToken.toString();
    const count = this.#groupDebugKeys.get(groupDebugKey);
    let newBeforeGroupToken: GroupInjectionToken;
    if (count) {
      newBeforeGroupToken = new GroupInjectionToken(`BEFORE ${groupDebugKey}-${count + 1}`);
      this.#groupDebugKeys.set(groupDebugKey, count + 1);
    } else {
      newBeforeGroupToken = new GroupInjectionToken(`BEFORE ${groupDebugKey}`);
      this.#groupDebugKeys.set(groupDebugKey, 1);
    }
    this.#groupTokens.set(groupToken, newBeforeGroupToken);
    return newBeforeGroupToken;
  }
}
