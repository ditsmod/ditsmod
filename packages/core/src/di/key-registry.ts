import { stringify } from './utils';
import { resolveForwardRef } from './forward-ref';

/**
 * A unique object used for retrieving items from the `ReflectiveInjector`.
 *
 * Keys have:
 * - a system-wide unique `id`.
 * - a `token`.
 *
 * `Key` is used internally by `ReflectiveInjector` because its system-wide unique `id` allows
 * the
 * injector to store created objects in a more efficient way.
 *
 * `Key` should not be created directly. `ReflectiveInjector` creates keys automatically when
 * resolving
 * providers.
 */
export class DualKey {
  public readonly displayName: string;
  /**
   * Private
   */
  constructor(public token: any, public id: number) {
    if (!token) {
      throw new Error('Token must be defined!');
    }
    this.displayName = stringify(this.token);
  }

  /**
   * Retrieves a `Key` for a token.
   */
  static get(token: any): DualKey {
    return _globalKeyRegistry.get(resolveForwardRef(token));
  }

  /**
   * @returns the number of keys registered in the system.
   */
  static get numberOfKeys(): number {
    return _globalKeyRegistry.numberOfKeys;
  }
}

export class KeyRegistry {
  private _allKeys = new Map<any, DualKey>();

  get(token: any): DualKey {
    if (token instanceof DualKey) {
      return token;
    }

    if (this._allKeys.has(token)) {
      return this._allKeys.get(token)!;
    }

    const newKey = new DualKey(token, DualKey.numberOfKeys);
    this._allKeys.set(token, newKey);
    return newKey;
  }

  get numberOfKeys(): number {
    return this._allKeys.size;
  }
}

const _globalKeyRegistry = new KeyRegistry();
