/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { Injectable, InjectionToken, Injector } from '@ts-stack/di';

export const HTTP_INTERCEPTORS = new InjectionToken<HttpInterceptor[]>('HTTP_INTERCEPTORS');

export interface HttpInterceptor {
  intercept(next?: HttpHandler): Promise<any>;
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
 * `HttpHandler` is injectable. When injected, the handler instance dispatches requests to the
 * first interceptor in the chain, which dispatches to the second, etc, eventually reaching the
 * `HttpBackend`.
 *
 * In an `HttpInterceptor`, the `HttpHandler` parameter is the next interceptor in the chain.
 */
export abstract class HttpHandler {
  abstract handle(): Promise<any>;
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
  abstract handle(): Promise<any>;
}

/**
 * An injectable `HttpHandler` that applies multiple interceptors
 * to a request before passing it to the given `HttpBackend`.
 *
 * The interceptors are loaded lazily from the injector, to allow
 * interceptors to themselves inject classes depending indirectly
 * on `DefaultHttpHandler` itself.
 */
@Injectable()
export class DefaultHttpHandler implements HttpHandler {
  private chain: HttpHandler | null = null;

  constructor(private frontend: HttpFrontend, private backend: HttpBackend, private injector: Injector) {}

  handle(): Promise<any> {
    if (this.chain === null) {
      const interceptors = this.injector.get(HTTP_INTERCEPTORS, []).slice();
      interceptors.unshift(this.frontend);
      this.chain = interceptors.reduceRight(
        (next, interceptor) => new HttpInterceptorHandler(next, interceptor),
        this.backend
      );
    }
    return this.chain.handle();
  }
}

export class HttpInterceptorHandler implements HttpHandler {
  constructor(private next: HttpHandler, private interceptor: HttpInterceptor) {}

  async handle(): Promise<any> {
    await this.interceptor.intercept(this.next);
  }
}
