import { Class, makePropDecorator } from '@ditsmod/core';

import { GuardItem } from '#interceptors/guard.js';
import { HttpInterceptor } from '#interceptors/tokens-and-types.js';

export interface TrpcRouteMetadata {
  guards: GuardItem[];
  interceptors: Class<HttpInterceptor>[];
}
/**
 * @param guards An array of DI tokens used to look up `CanActivate()` handlers,
 * in order to determine if the current user is allowed to activate the controller.
 * By default, any user can activate.
 */
function routeFn(
  guards: GuardItem[] = [],
  interceptors: Class<HttpInterceptor>[] = [],
): TrpcRouteMetadata {
  return { guards, interceptors };
}

export const trpcRoute = makePropDecorator(routeFn);
