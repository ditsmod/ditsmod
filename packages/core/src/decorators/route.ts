import { makePropDecorator } from '@ts-stack/di';

import { AnyObj } from '../types/mix';
import { GuardItem } from '../types/mix';
import { HttpMethod } from '../types/mix';

export type RouteDecoratorFactory = (method: HttpMethod, path?: string, guards?: GuardItem[]) => RouteDecorator;

export type RouteDecorator = <T>(
  target: AnyObj,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<T>
) => RouteDecoratorMetadata;

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
function route(httpMethod: HttpMethod, path: string = '', guards: GuardItem[] = []): RouteMetadata {
  return { httpMethod, path, guards };
}

export const Route = makePropDecorator('Route', route) as RouteDecoratorFactory;
