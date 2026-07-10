import type { Class, HttpMethod, Provider } from '@ditsmod/core';

import type { RouteMeta } from './route-data.js';
import type { HttpInterceptor } from '#interceptors/tokens-and-types.js';
import type { NormalizedGuard } from '../interceptors/guard.js';

export interface ControllerMetadata {
  /**
   * ProviderBuilder per a route.
   */
  providersPerRou: Provider[];
  /**
   * ProviderBuilder per a request.
   */
  providersPerReq: Provider[];
  /**
   * This path consists of the following components: `[per app prefix]` + `[per module prefix]` + `[route (in controller) path]`
   */
  fullPath: string;
  httpMethods: HttpMethod[];
  interceptors: Class<HttpInterceptor>[];
  routeMeta: RouteMeta;
  /**
   * Indicates in which mode the controller methods work.
   *
   * The operation of the controller in `route` mode means that its methods,
   * which are bound to routes, receive a single argument - an object containing
   * context data, including native request objects.
   */
  scope?: 'route';
  guards: NormalizedGuard[];
}
