import { StackUtils } from '@ts-stack/stack-utils';

import { DiError } from '../di';

export function cleanInitErrorTrace(error: any) {
  if (error instanceof DiError) {
    const internals: any[] = [
      ...StackUtils.nodeInternals(),
      /\/di\/error-handling\./,
      /\/di\/deps-checker\./,
      /\/di\/injector\./,
      /^\s+at Array.forEach \(<anonymous>\)$/,
    ];
    const stack = new StackUtils({ internals, removeFirstLine: false });
    error.stack = stack.clean(error.stack || '');
  }
}
