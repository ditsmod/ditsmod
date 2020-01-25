/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { InjectionToken } from 'ts-di';

import { Route } from '../types';
import { AppRouter } from '../app-router';

/**
 * Flattens an array.
 */
export function flatten(list: any[], dst?: any[]): any[] {
  if (dst === undefined) {
    dst = list;
  }
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (Array.isArray(item)) {
      // we need to inline it.
      if (dst === list) {
        // Our assumption that the list was already flat was wrong and
        // we need to clone flat since we need to write to it.
        dst = list.slice(0, i);
      }
      flatten(item, dst);
    } else if (dst !== list) {
      dst.push(item);
    }
  }
  return dst;
}

/**
 * The [DI token](guide/glossary/#di-token) for a router configuration.
 */
export const ROUTES = new InjectionToken<Route[][]>('ROUTES');

/**
 * Registers a [DI provider](guide/glossary#provider) for a set of routes.
 *
 * ```
 * @NgModule({
 *   imports: [RouterModule.forChild(ROUTES)],
 *   providers: [provideRoutes(EXTRA_ROUTES)]
 * })
 * class MyNgModule {}
 * ```
 *
 * @param routes The route configuration to provide.
 */
export function provideRoutes(routes: Route[]): any {
  return [{ provide: ROUTES, multi: true, useValue: routes }];
}

/**
 * A [DI token](guide/glossary/#di-token) for the router service.
 */
export const ROUTER_CONFIGURATION = new InjectionToken<void>('ROUTER_CONFIGURATION');

export const ROUTER_FORROOT_GUARD = new InjectionToken<void>('ROUTER_FORROOT_GUARD');

export function provideForRootGuard(router: AppRouter): any {
  if (router) {
    throw new Error(
      `RouterModule.forRoot() called twice. Lazy loaded modules should use RouterModule.forChild() instead.`
    );
  }
  return 'guarded';
}
