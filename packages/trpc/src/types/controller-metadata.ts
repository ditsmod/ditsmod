import type { Class, Provider } from '@ditsmod/core';

import type { TrpcRouteMeta } from './trpc-route-data.js';
import type { TrpcHttpInterceptor } from '#interceptors/tokens-and-types.js';
import type { NormalizedGuard } from '../interceptors/trpc-guard.js';

export interface ControllerMeta {
  /**
   * Providers per a route.
   */
  providersPerRou: Provider[];
  /**
   * Providers per a request.
   */
  providersPerReq: Provider[];
  routeMeta: TrpcRouteMeta;
  guards: NormalizedGuard[];
  interceptors: Class<TrpcHttpInterceptor>[];
}
