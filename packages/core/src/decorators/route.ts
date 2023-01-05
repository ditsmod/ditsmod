import { makePropDecorator } from '../di';

import { GuardItem, HttpMethod } from '../types/mix';

export interface RouteDecoratorMetadata {
  [key: string]: RouteMetadata[];
}

export interface RouteMetadata {
  httpMethod: HttpMethod;
  path: string;
  guards: GuardItem[];
}
/**
 * @param guards An array of DI tokens used to look up `CanActivate()` handlers,
 * in order to determine if the current user is allowed to activate the controller.
 * By default, any user can activate.
 */
function routeFn(httpMethod: HttpMethod, path: string = '', guards: GuardItem[] = []): RouteMetadata {
  return { httpMethod, path, guards };
}

export const route = makePropDecorator(routeFn);
