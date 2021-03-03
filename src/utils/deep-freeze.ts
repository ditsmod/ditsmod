import { ObjectAny } from '../types/types';

/**
 * @todo Check why `return Object.freeze(obj)` break module work in some cases.
 */
export function deepFreeze<T extends ObjectAny | ObjectAny[]>(obj: T): T {
  if (!obj) {
    return;
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      deepFreeze(item);
    }
  } else {
    // Retrieve the property names defined on object
    const propNames = Object.getOwnPropertyNames(obj);
    // Freeze properties before freezing self
    for (const name of propNames) {
      const value = (obj as ObjectAny)[name];

      if (value && typeof value == 'object') {
        deepFreeze(value);
      }
    }
  }

  return Object.freeze(obj);
}
