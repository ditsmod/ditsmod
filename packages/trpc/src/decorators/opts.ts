import type { InjectTransformResult } from '@ditsmod/core';
import { ctx, inject, Reflector } from '@ditsmod/core';
import { TRPC_OPTS } from '#types/constants.js';

/**
 * Intended for use in service method parameters to provide context data such as `ctx`, `input`, `path`, and `signal`.
 */
export const optsFactory = Reflector.makeParamDecorator(
  () => {
    return { token: ctx, input: TRPC_OPTS } satisfies InjectTransformResult;
  },
  'opts',
  inject,
);

export const opts = optsFactory();
