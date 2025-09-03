import { Class, Provider } from '@ditsmod/core';

import { RouteMeta } from './route-data.js';
import { HttpInterceptor } from '#interceptors/tokens-and-types.js';
import { NormalizedGuard } from '../interceptors/guard.js';

export interface ControllerMetadata {
  /**
   * Providers per a route.
   */
  providersPerRou: Provider[];
  /**
   * Providers per a request.
   */
  providersPerReq: Provider[];
  interceptors: Class<HttpInterceptor>[];
  routeMeta: RouteMeta;
  guards: NormalizedGuard[];
}
