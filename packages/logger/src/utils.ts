import { Writable } from 'stream';
import { ChainError } from '@ts-stack/chain-error';

import { LogFields, Obj } from './types';
import { safeJsonStringify } from './safe-json-stringify';

export function isWritable(obj: object): obj is Writable {
  return obj && typeof (obj as Writable).write == 'function';
}

/**
 * Gather some caller info 3 stack levels up.
 * See <http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi>.
 */
export function getCaller3Info() {
  if (this === undefined) {
    // Cannot access caller info in 'strict' mode.
    return;
  }
  const obj: Obj = {};
  const saveLimit = Error.stackTraceLimit;
  const savePrepare = Error.prepareStackTrace;
  Error.stackTraceLimit = 3;

  Error.prepareStackTrace = (_, stack) => {
    const caller = stack[2];
    obj.file = caller.getFileName();
    obj.line = caller.getLineNumber();
    const func = caller.getFunctionName();
    if (func) {
      obj.func = func;
    }
  };
  Error.captureStackTrace(this, getCaller3Info);
  // tslint:disable-next-line:no-unused-expression
  (this as any).stack;

  Error.stackTraceLimit = saveLimit;
  Error.prepareStackTrace = savePrepare;
  return obj;
}

// internal dev/debug logging
export function xxx(str: string, ...args: any[]) {
  if (true) {
    return;
  } // comment out to turn on debug logging
  console.error.apply(this, ['XXX: ' + str].concat(args));
}

/**
 * A fast JSON.stringify that handles cycles and getter exceptions (when
 * safeJsonStringify is installed).
 *
 * This function attempts to use the regular JSON.stringify for speed, but on
 * error (e.g. JSON cycle detection exception) it falls back to safe stringify
 * handlers that can deal with cycles and/or getter exceptions.
 */
export function fastAndSafeJsonStringify(rec: LogFields) {
  try {
    return JSON.stringify(rec);
  } catch (ex) {
    try {
      return JSON.stringify(rec, safeCycles());
    } catch (e) {
      return safeJsonStringify(rec);
    }
  }
}

/**
 * A JSON stringifier that handles cycles safely
 * Usage:
 *
 * ```ts
 * JSON.stringify(obj, safeCycles());
 * ```
 */
export function safeCycles() {
  const set = new Set();
  return (key: string, val: any) => {
    if (!val || typeof val != 'object') {
      return val;
    }
    if (set.has(val)) {
      return '[Circular]';
    }
    set.add(val);
    return val;
  };
}

/**
 * This function dumps long stack traces for exceptions having a `ChainError.getCause(err)`
 * method. The error classes from
 * [verror](https://github.com/davepacheco/node-verror) and
 * [restify v2.0](https://github.com/mcavage/node-restify) are examples.
 *
 * Based on `dumpException` in
 * https://github.com/davepacheco/node-extsprintf/blob/master/lib/extsprintf.js
 */
export function getFullErrorStack(err: Error | ChainError) {
  let str = err.stack || err.toString();
  const cause = ChainError.getCause(err);
  if (cause) {
    str += '\ncaused by: ' + getFullErrorStack(cause);
  }
  return str;
}
