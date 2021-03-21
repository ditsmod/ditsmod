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

export abstract class HttpFrontend implements HttpInterceptor {
  abstract intercept(req: Request, next?: HttpHandler, ...args: any[]): Promise<any>;
}

/**
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
 * A final `HttpHandler` which will dispatch the request to `DefaultHttpBackend`.
 *
 * Interceptors sit between the `DefaultHttpFrontend` and the `HttpBackend`.
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
 * on `HttpInterceptingHandler` itself.
 */
@Injectable()
export class HttpInterceptingHandler implements HttpHandler {
  private chain: HttpHandler | null = null;

  constructor(private frontend: HttpFrontend, private backend: HttpBackend, private injector: Injector) {}

  handle(req: Request, ...args: any[]): Promise<any> {
    if (this.chain === null) {
      const interceptors = this.injector.get(HTTP_INTERCEPTORS, []).slice();
      interceptors.unshift(this.frontend);
      this.chain = interceptors.reduceRight(
        (next, interceptor) => new HttpInterceptorHandler(next, interceptor),
        this.backend
      );
    }
    return this.chain.handle(req, ...args);
  }
}

export class HttpInterceptorHandler implements HttpHandler {
  constructor(private next: HttpHandler, private interceptor: HttpInterceptor) {}

  async handle(req: Request, ...args: any[]): Promise<any> {
    await this.interceptor.intercept(req, this.next, ...args);
  }
}
