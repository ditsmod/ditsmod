import { createInjectionSymbol } from '@ditsmod/core';
import type { initTRPC } from '@trpc/server';

import type { TrpcOpts } from '#types/types.js';

export type TrpcRootType = ReturnType<typeof initTRPC.create>;
export const TRPC_ROOT = createInjectionSymbol<TrpcRootType>('TRPC_ROOT');

/**
 * A token used to obtain {@link TrpcOpts} in service methods
 * that are passed to DI at the request level.
 */
export const TRPC_OPTS = createInjectionSymbol<TrpcOpts>('TRPC_OPTS');
