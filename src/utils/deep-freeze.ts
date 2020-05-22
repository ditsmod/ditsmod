import { ObjectAny } from 'src/types/types';

/**
 * @todo Check why `return Object.freeze(obj)` break module work in some cases.
 */
export function deepFreeze<T extends ObjectAny>(obj: T): T {
  if (!obj) {
    return;
  }

  const props = Object.getOwnPropertyNames(obj);

  for (const name of props) {
    const value = obj[name];

    if (value && typeof value == 'object') {
      deepFreeze(value);
    }
  }

  // return Object.freeze(obj);
  return obj;
}
