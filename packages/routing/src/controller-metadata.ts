import { Class, Extension, HttpMethod, InjectionToken, NormalizedGuard, Provider } from '@ditsmod/core';

import { RouteMeta } from './route-data.js';
import { HttpInterceptor } from '#mod/interceptors/tokens-and-types.js';

export interface ControllerMetadata {
  /**
   * Providers per a route.
   */
  providersPerRou: Provider[];
  /**
   * Providers per a request.
   */
  providersPerReq: Provider[];
  path: string;
  httpMethods: HttpMethod[];
  interceptors: (Class<HttpInterceptor> | InjectionToken<Extension[]>)[];
  routeMeta: RouteMeta;
  /**
   * Singleton per scope.
   * 
   * __Warn__: at the moment, this is an experimental feature.
   *
   * Default - `module`.
   */
  scope?: 'ctx';
  guards: NormalizedGuard[];
}
