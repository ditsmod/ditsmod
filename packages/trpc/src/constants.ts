import { InjectionToken } from '@ditsmod/core';
import { initTRPC } from '@trpc/server';

import { TrpcOpts } from './types.js';

export const TRPC_OPTS = new InjectionToken<TrpcOpts>('TRPC_OPTS');
export const t = initTRPC.create();
export const TRPC_ROOT = new InjectionToken<typeof t>('TRPC_ROOT');
