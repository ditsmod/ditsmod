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
   * Indicates in which mode the controller methods work.
   *
   * The operation of the controller in `ctx` mode means that its methods,
   * which are bound to routes, receive a single argument - an object containing
   * context data, including native request objects.
   */
  scope?: 'ctx';
  guards: NormalizedGuard[];
}
