import { Class, Provider } from '@ditsmod/core';

import { TrpcRouteMeta } from './trpc-route-data.js';
import { TrpcHttpInterceptor } from '#interceptors/tokens-and-types.js';
import { NormalizedGuard } from '../interceptors/trpc-guard.js';

export interface ControllerMetadata {
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
