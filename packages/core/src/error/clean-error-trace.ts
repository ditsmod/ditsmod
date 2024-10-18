import { StackUtils } from '@ts-stack/stack-utils';

/**
 * Cleans error stack traces. If you want more options to clean up the stack trace,
 * you can use the [@ts-stack/stack-utils](https://github.com/ts-stack/stack-utils) library directly.
 */
export function cleanErrorTrace(error: any, regExp: RegExp[] = []) {
  const descriptor = Object.getOwnPropertyDescriptor(error, 'stack');
  if (descriptor?.writable === false || (descriptor?.get && !descriptor?.set)) {
    return error;
  }
  const internals: any[] = [
    ...StackUtils.nodeInternals(),
    /@ditsmod/,
    /ditsmod\/packages/,
    /^\s+at Array.forEach \(<anonymous>\)$/,
    ...regExp,
  ];
  const stack = new StackUtils({ internals });
  error.stack = stack.clean(error.stack || '');
  return error;
}
