import { AnyObj, InjectionToken } from '@ditsmod/core';
import type { initTRPC } from '@trpc/server';

import { RawRequest, RawResponse, TrpcRouterOpts } from '#types/types.js';

export const TRPC_ROUTER_OPTS = new InjectionToken<TrpcRouterOpts>('TRPC_ROUTER_OPTS');
export type TrpcRootType = ReturnType<typeof initTRPC.create>;
export const TRPC_ROOT = new InjectionToken<TrpcRootType>('TRPC_ROOT');

export interface TrpcOpts<Context extends AnyObj = AnyObj, Input = void> {
  ctx: { req: RawRequest; res: RawResponse } & Context;
  input: Input;
  /**
   * The path of the procedure.
   */
  path: string;
  /**
   * The AbortSignal of the request.
   */
  signal: AbortSignal | undefined;
}
/**
 * A token used to obtain {@link TrpcOpts} in service methods
 * that are passed to DI at the request level.
 */
export const TRPC_OPTS = new InjectionToken<TrpcOpts>('TRPC_OPTS');
