import { InjectionToken } from '@ditsmod/core';
import type { initTRPC } from '@trpc/server';

import type { TrpcOpts, TrpcRouterOpts } from '#types/types.js';

export type TrpcRootType = ReturnType<typeof initTRPC.create>;
export const TRPC_ROOT = new InjectionToken<TrpcRootType>('TRPC_ROOT');

/**
 * A token used to obtain {@link TrpcOpts} in service methods
 * that are passed to DI at the request level.
 */
export const TRPC_OPTS = new InjectionToken<TrpcOpts>('TRPC_OPTS');
