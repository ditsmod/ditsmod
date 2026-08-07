import type { InjectTransformResult } from '@holu/core';
import { ctx, inject, Reflector } from '@holu/core';
import { TRPC_OPTS } from '#types/constants.js';

/**
 * Intended for use in service method parameters to provide context data such as `ctx`, `input`, `path`, and `signal`.
 */
export const trpcOptsFactory = Reflector.makeParamDecorator(
  () => {
    return { token: ctx, input: TRPC_OPTS } satisfies InjectTransformResult;
  },
  'opts',
  inject,
);

export const opts = trpcOptsFactory();
