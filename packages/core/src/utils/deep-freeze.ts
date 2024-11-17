import { AnyObj } from '#types/mix.js';

export function deepFreeze<T extends AnyObj | AnyObj[]>(obj: T): T {
  if (Array.isArray(obj)) {
    for (const item of obj) {
      deepFreeze(item);
    }
  } else {
    // Retrieve the property names defined on object
    const propNames = Object.getOwnPropertyNames(obj);
    // Freeze properties before freezing self
    for (const name of propNames) {
      const value = (obj as AnyObj)[name];

      if (value && typeof value == 'object') {
        deepFreeze(value);
      }
    }
  }

  return Object.freeze(obj);
}
