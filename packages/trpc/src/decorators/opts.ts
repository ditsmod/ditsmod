import { inject, InjectTransformResult, makeParamDecorator } from '@ditsmod/core';
import { TRPC_OPTS } from '../constants.js';

/**
 * Intended for use in service method parameters when this parameter should return
 * context data such as `ctx`, `input`, `path` and `signal`.
 */
export const opts = makeParamDecorator(() => {
  return { token: TRPC_OPTS } satisfies InjectTransformResult;
}, inject)();
