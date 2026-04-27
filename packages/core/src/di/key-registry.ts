import { ExtensionClass } from '#extension/extension-types.js';
import { getDebugClassName } from '#utils/get-debug-class-name.js';
import { TokenMustBeDefined } from './errors.js';
import { resolveForwardRef } from './forward-ref.js';
import { InjectionToken } from './injection-token.js';

/**
 * `DualKey` is used internally by `Injector` because its system-wide unique `id` allows
 * the injector to store created objects in a more efficient way.
 *
 * `DualKey` should not be created directly. `Injector` creates keys automatically when
 * resolving providers.
 */
export class DualKey {
  constructor(
    public token: any,
    /**
     * System-wide unique `id`
     */
    public id: number,
  ) {}
}

/**
 * This class is used to automatically create an extension group.
 */
export class GroupToken<T = any> extends InjectionToken<T> {}

/**
 * This class is used to automatically create a token for `@inject(token, ctx)`.
 */
export class ParamToken<T = any> extends InjectionToken<T> {}

// @todo After the reinit application, check for memory leaks.
export class KeyRegistry {
  static #allKeys = new Map<any, DualKey>();
  static #groupTokens = new Map<ExtensionClass, GroupToken>();
  static #groupDebugKeys = new Map<string, number>();

  /**
   * Retrieves a `DualKey` for a token.
   */
  static get(token: NonNullable<unknown>): DualKey {
    token = resolveForwardRef(token);

    const value = this.#allKeys.get(token);
    if (value || this.#allKeys.has(token)) {
      return value!;
    }

    if (!token) {
      throw new TokenMustBeDefined();
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
   * Generates a unique token for an extension group, doing so strictly once per extension.
   * On subsequent requests for the extension, the previously generated unique token is returned.
   */
  static getGroupToken(extension: ExtensionClass): GroupToken {
    const groupToken = this.#groupTokens.get(extension);
    if (groupToken) {
      return groupToken;
    }

    const groupDebugKey = getDebugClassName(extension) || extension.toString();
    const count = this.#groupDebugKeys.get(groupDebugKey);
    let newGroupToken: GroupToken;
    if (count) {
      newGroupToken = new GroupToken(`group of ${groupDebugKey}-${count + 1}`);
      this.#groupDebugKeys.set(groupDebugKey, count + 1);
    } else {
      newGroupToken = new GroupToken(`group of ${groupDebugKey}`);
      this.#groupDebugKeys.set(groupDebugKey, 1);
    }
    this.#groupTokens.set(extension, newGroupToken);
    return newGroupToken;
  }
}
