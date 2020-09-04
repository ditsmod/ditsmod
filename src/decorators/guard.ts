import { makePropDecorator, Type } from '@ts-stack/di';

import { ObjectAny } from '../types/types';

export interface GuardMetadata {
  guard: any;
  params?: any[];
}

export interface GuardDecoratorMetadata {
  [methodName: string]: GuardMetadata[];
}

export type GuardDecorator = <T>(
  target: ObjectAny,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<T>
) => GuardDecoratorMetadata;
/**
 * @param guard An array of DI tokens used to look up `CanActivate()` handlers,
 * in order to determine if the current user is allowed to activate the controller.
 * By default, any user can activate.
 */
function guardFn(guard: any, params?: any[]): GuardMetadata {
  return { guard, params };
}

export type GuardDecoratorFactory = (guard: Type<CanActivate>, params?: any[]) => GuardDecorator;
export const Guard = makePropDecorator('Guard', guardFn) as GuardDecoratorFactory;
export interface CanActivate {
  canActivate(params?: any[]): boolean | number | Promise<boolean | number>;
}
