import { Class, makePropDecorator } from '@ditsmod/core';

import { GuardItem } from '#interceptors/trpc-guard.js';
import { TrpcHttpInterceptor } from '#interceptors/tokens-and-types.js';

export interface TrpcRouteMetadata {
  guards: GuardItem[];
  interceptors: Class<TrpcHttpInterceptor>[];
}
/**
 * @param guards An array of DI tokens used to look up `TrpcCanActivate()` handlers,
 * in order to determine if the current user is allowed to activate the trpcController.
 * By default, any user can activate.
 */
function routeFn(
  guards: GuardItem[] = [],
  interceptors: Class<TrpcHttpInterceptor>[] = [],
): TrpcRouteMetadata {
  return { guards, interceptors };
}

export const trpcRoute = makePropDecorator(routeFn);
