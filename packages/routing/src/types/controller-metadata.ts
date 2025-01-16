import { Class, HttpMethod, Provider } from '@ditsmod/core';

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
   * The operation of the controller in `ctx` mode means that its methods,
   * which are bound to routes, receive a single argument - an object containing
   * context data, including native request objects.
   */
  scope?: 'ctx';
  guards: NormalizedGuard[];
}
