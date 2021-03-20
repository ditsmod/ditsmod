/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { Injectable, InjectionToken, Injector } from '@ts-stack/di';

import { Request } from '../services/request';

export const HTTP_INTERCEPTORS = new InjectionToken<HttpInterceptor[]>('HTTP_INTERCEPTORS');

export interface HttpInterceptor {
  intercept(req: Request, next?: HttpHandler, ...args: any[]): Promise<any>;
}

/**
 * Transforms an `NodeRequest` into a Promise which will likely be a `NodeResponse`.
 *
 * `HttpHandler` is injectable. When injected, the handler instance dispatches requests to the
 * first interceptor in the chain, which dispatches to the second, etc, eventually reaching the
 * `HttpBackend`.
 *
 * In an `HttpInterceptor`, the `HttpHandler` parameter is the next interceptor in the chain.
 */
export abstract class HttpHandler {
  abstract handle(req: Request, ...args: any[]): Promise<any>;
}

/**
 * A final `HttpHandler` which will dispatch the request via browser HTTP APIs to a backend.
 *
 * Interceptors sit between the `HttpClient` interface and the `HttpBackend`.
 *
 * When injected, `HttpBackend` dispatches requests directly to the backend, without going
 * through the interceptor chain.
 */
export abstract class HttpBackend implements HttpHandler {
  abstract handle(req: Request, ...args: any[]): Promise<any>;
}

/**
 * An injectable `HttpHandler` that applies multiple interceptors
 * to a request before passing it to the given `HttpBackend`.
 *
 * The interceptors are loaded lazily from the injector, to allow
 * interceptors to themselves inject classes depending indirectly
 * on `HttpInterceptorsChain` itself.
 * @see `HttpInterceptor`
 */
@Injectable()
export class HttpInterceptorsChain {
  private chain: HttpHandler | null = null;

  constructor(private backend: HttpBackend, private injector: Injector) {}

  getChain() {
    if (this.chain === null) {
      const interceptors = this.injector.get(HTTP_INTERCEPTORS, []);
      this.chain = interceptors.reduceRight(
        (next, interceptor) => new HttpInterceptorHandler(next, interceptor),
        this.backend
      );
    }
    return this.chain;
  }
}

/**
 * `HttpHandler` which applies an `HttpInterceptor` to an `NodeRequest`.
 */
export class HttpInterceptorHandler implements HttpHandler {
  constructor(private next: HttpHandler, private interceptor: HttpInterceptor) {}

  handle(req: Request, ...args: any[]): Promise<any> {
    return this.interceptor.intercept(req, this.next, ...args);
  }
}
