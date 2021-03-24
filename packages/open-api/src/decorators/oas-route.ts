import { edk, CanActivate } from '@ditsmod/core';
import { makePropDecorator, Type } from '@ts-stack/di';
import { PathItemObject } from '@ts-stack/open-api-spec';

export type DecoratorGuardItem = Type<CanActivate> | [Type<CanActivate>, ...any[]];

export function keyOf<T extends Type<any>>(klass: T, property: keyof T['prototype']) {
  return { klass, property };
}

export type OasRouteDecoratorFactory = (path: string, config: PathItemObject) => OasRouteDecorator;

export type OasRouteDecorator = <T>(
  target: edk.AnyObj,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<T>
) => OasRouteDecoratorMetadata;

export interface OasRouteDecoratorMetadata {
  [key: string]: OasRouteMetadata[];
}

export interface OasRouteMetadata {
  path: string;
  configs: PathItemObject;
}
/**
 * @param config description here
 */
function oasRoute(path: string, configs: PathItemObject): OasRouteMetadata {
  return { path, configs };
}

export const OasRoute = makePropDecorator('OasRoute', oasRoute) as OasRouteDecoratorFactory;
