/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { RouteMeta } from './route-data';

export interface HttpInterceptor {
  intercept(routeMeta: RouteMeta, next?: HttpHandler): Promise<any>;
}

/**
 * A first `HttpHandler` which will dispatch the request to next interceptor in the chain.
 *
 * Interceptors sit between the `HttpFrontend` and the `HttpBackend`.
 */
export abstract class HttpFrontend implements HttpInterceptor {
  abstract intercept(routeMeta: RouteMeta, next?: HttpHandler): Promise<any>;
}

/**
 * `HttpHandler` is injectable. When injected, the handler instance dispatches requests to the
 * first interceptor in the chain, which dispatches to the second, etc, eventually reaching the
 * `HttpBackend`.
 *
 * In an `HttpInterceptor`, the `HttpHandler` parameter is the next interceptor in the chain.
 */
export abstract class HttpHandler {
  abstract handle(routeMeta: RouteMeta): Promise<any>;
}

/**
 * A final `HttpHandler` which will dispatch the request to controller's route method.
 *
 * Interceptors sit between the `HttpFrontend` and the `HttpBackend`.
 *
 * When injected in an interceptor, `HttpBackend` can dispatches requests directly to
 * controller's route method, without going through the next interceptors in the chain.
 */
export abstract class HttpBackend implements HttpHandler {
  abstract handle(routeMeta: RouteMeta): Promise<any>;
}
