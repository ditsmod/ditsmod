import { InjectionToken } from '@ditsmod/core';
import type { initTRPC } from '@trpc/server';
import type { MiddlewareFunction } from '@trpc/server/unstable-core-do-not-import';

import { RawRequest, RawResponse, TrpcRouterOpts } from '#types/types.js';

export const TRPC_ROUTER_OPTS = new InjectionToken<TrpcRouterOpts>('TRPC_ROUTER_OPTS');
export type TrpcRootType = ReturnType<typeof initTRPC.create>;
export const TRPC_ROOT = new InjectionToken<TrpcRootType>('TRPC_ROOT');

/**
 * Shortened version of {@link MiddlewareFunction | MiddlewareFunction's options}.
 */
export type TrpcOpts<Input = any> = Parameters<
  MiddlewareFunction<{ req: RawRequest; res: RawResponse }, object, object, unknown, Input>
>[0];
/**
 * A token used to obtain {@link TrpcOpts} in service methods
 * that are passed to DI at the request level.
 */
export const TRPC_OPTS = new InjectionToken<TrpcOpts>('TRPC_OPTS');
