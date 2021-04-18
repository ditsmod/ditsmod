// Taken from https://github.com/debitoor/safe-json-stringify

import { Obj } from './types';

const hasProp = Object.prototype.hasOwnProperty;

function throwsMessage(err: Error) {
  return '[Throws: ' + (err ? err.message : '?') + ']';
}

function safeGetValueFromPropertyOnObject(obj: Obj, property: string) {
  if (hasProp.call(obj, property)) {
    try {
      return obj[property];
    } catch (err) {
      return throwsMessage(err);
    }
  }

  return obj[property];
}

export function ensureProperties(obj: Obj) {
  const set = new Set(); // store references to objects we have seen before

  function visit(input: any): string | Obj {
    if (input === null || typeof input != 'object') {
      return input;
    }

    if (set.has(input)) {
      return '[Circular]';
    }

    set.add(input);

    if (typeof input.toJSON == 'function') {
      try {
        const fResult = visit(input.toJSON());
        set.delete(input);
        return fResult;
      } catch (err) {
        return throwsMessage(err);
      }
    }

    if (Array.isArray(input)) {
      const aResult = input.map(visit);
      set.delete(input);
      return aResult;
    }

    const reducer = (accumulator: Obj, currentValue: string) => {
      // prevent faulty defined getter properties
      accumulator[currentValue] = visit(safeGetValueFromPropertyOnObject(input, currentValue));
      return accumulator;
    };
    const result = Object.keys(input).reduce(reducer, {});
    set.delete(input);
    return result;
  }

  return visit(obj);
}

/**
 * The `safe-json-stringify` function.
 */
export function safeJsonStringify(data: any, replacer?: any, space?: any) {
  return JSON.stringify(ensureProperties(data), replacer, space);
}
