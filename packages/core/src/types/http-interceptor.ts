/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { PathParam } from './router.js';
import { NodeRequest, NodeResponse } from './server-options.js';

export class InterceptorContext {
  constructor(
    public nodeReq: NodeRequest,
    public nodeRes: NodeResponse,
    public aPathParams: PathParam[],
    public queryString: string = '',
  ) {}
}

/**
 * `HttpHandler` is injectable. When injected, the handler instance dispatches requests to the
 * first interceptor in the chain, which dispatches to the second, etc, eventually reaching the
 * `HttpBackend` and controller's method bounded to some route.
 *
 * In an `HttpInterceptor`, the `HttpHandler` parameter is the next interceptor in the chain.
 */
export abstract class HttpHandler {
  abstract handle(...args: any[]): Promise<any>;
}

export interface HttpInterceptor {
  intercept(next?: HttpHandler): Promise<any>;
}

export class HttpInterceptorHandler implements HttpHandler {
  constructor(
    private interceptor: HttpInterceptor,
    private next: HttpHandler,
  ) {}

  async handle(): Promise<any> {
    return this.interceptor.intercept(this.next);
  }
}

/**
 * A first `HttpHandler` which will dispatch the request to next interceptor in the chain.
 *
 * Interceptors sit between the `HttpFrontend` and the `HttpBackend`.
 */
export abstract class HttpFrontend implements HttpInterceptor {
  abstract intercept(next?: HttpHandler): Promise<any>;
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
  abstract handle(...args: any[]): any;
}
