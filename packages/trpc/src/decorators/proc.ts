import { inject, InjectTransformResult, makeParamDecorator } from '@ditsmod/core/di';
import { TRPC_PROC } from '../constants.js';

/**
 * Decorator for method parameters. Allows integrating tRPC procedures with Ditsmod interceptors and guards.
 */
export const proc: ProcDecorator = makeParamDecorator((ctx?) => {
  return { token: TRPC_PROC, ctx } satisfies InjectTransformResult;
}, inject);

export interface ProcDecorator {
  <T extends NonNullable<unknown>>(ctx?: T): any;
}
