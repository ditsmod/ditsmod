import { resolveForwardRef } from './forward-ref.js';

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
  constructor(public token: any, public id: number) {}
}

export class KeyRegistry {
  static #allKeys = new Map<any, DualKey>();

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
      throw new Error('Token must be defined!');
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
}
