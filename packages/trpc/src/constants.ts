import { InjectionToken } from '@ditsmod/core';
import type { initTRPC } from '@trpc/server';

import { TrpcRouterOpts } from './types.js';

export const TRPC_ROUTER_OPTS = new InjectionToken<TrpcRouterOpts>('TRPC_ROUTER_OPTS');
export type TrpcRootType = ReturnType<typeof initTRPC.create>;
export const TRPC_ROOT = new InjectionToken<TrpcRootType>('TRPC_ROOT');
export const TRPC_OPTS = new InjectionToken<any>('TRPC_OPTS');
