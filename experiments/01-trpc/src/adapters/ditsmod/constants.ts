import { InjectionToken } from '@ditsmod/core';
import { TrcpOpts } from './types.js';

export const TRPC_OPTS = new InjectionToken<TrcpOpts>('TRPC_OPTS');
