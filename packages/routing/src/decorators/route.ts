import { HttpInterceptor } from '#mod/interceptors/tokens-and-types.js';
import { Class, GuardItem, HttpMethod, makePropDecorator } from '@ditsmod/core';

export interface RouteDecoratorMetadata {
  [key: string]: RouteMetadata[];
}

export interface RouteMetadata {
  httpMethod: HttpMethod | [HttpMethod, ...HttpMethod[]];
  path: string;
  guards: GuardItem[];
  interceptors: Class<HttpInterceptor>[];
}
/**
 * @param guards An array of DI tokens used to look up `CanActivate()` handlers,
 * in order to determine if the current user is allowed to activate the controller.
 * By default, any user can activate.
 */
function routeFn(
  httpMethod: HttpMethod | [HttpMethod, ...HttpMethod[]],
  path: string = '',
  guards: GuardItem[] = [],
  interceptors: Class<HttpInterceptor>[] = [],
): RouteMetadata {
  return { httpMethod, path, guards, interceptors };
}

export const route = makePropDecorator(routeFn);
