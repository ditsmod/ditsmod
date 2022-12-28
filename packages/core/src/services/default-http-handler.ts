/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { injectable, Injector } from '@ts-stack/di';
import { RouteMeta } from '../types/route-data';

import { HTTP_INTERCEPTORS } from '../constans';
import { HttpFrontend, HttpBackend, HttpHandler, HttpInterceptor } from '../types/http-interceptor';

/**
 * An injectable `HttpHandler` that applies multiple interceptors
 * to a request before passing it to the given `HttpBackend`.
 *
 * The interceptors are loaded lazily from the injector, to allow
 * interceptors to themselves inject classes depending indirectly
 * on `DefaultHttpHandler` itself.
 */
@injectable()
export class DefaultHttpHandler implements HttpHandler {
  private chain: HttpHandler | null;

  constructor(private frontend: HttpFrontend, private backend: HttpBackend, private injector: Injector) {}

  handle(routeMeta: RouteMeta): Promise<any> {
    if (!this.chain) {
      const interceptors = this.injector.get(HTTP_INTERCEPTORS, []).slice();
      interceptors.unshift(this.frontend);
      this.chain = interceptors.reduceRight(
        (next, interceptor) => new HttpInterceptorHandler(next, interceptor),
        this.backend
      );
    }
    return this.chain.handle(routeMeta);
  }
}

export class HttpInterceptorHandler implements HttpHandler {
  constructor(private next: HttpHandler, private interceptor: HttpInterceptor) {}

  async handle(routeMeta: RouteMeta): Promise<any> {
    await this.interceptor.intercept(routeMeta, this.next);
  }
}
