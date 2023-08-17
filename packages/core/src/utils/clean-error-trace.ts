import { StackUtils } from '@ts-stack/stack-utils';

export function cleanErrorTrace(error: any) {
  const internals: any[] = [
    ...StackUtils.nodeInternals(),
    /\/ditsmod(:?\/packages)?\/core\//,
    /^\s+at Array.forEach \(<anonymous>\)$/,
  ];
  const stack = new StackUtils({ internals, removeFirstLine: false });
  error.stack = stack.clean(error.stack || '');
  return error;
}
