import { edk, CanActivate, GuardItem } from '@ditsmod/core';
import { makePropDecorator, Type } from '@ts-stack/di';
import { XPathItemObject } from '@ts-stack/openapi-spec';

export type DecoratorGuardItem = Type<CanActivate> | [Type<CanActivate>, ...any[]];

export function keyOf<T extends Type<any>>(klass: T, property: keyof T['prototype']) {
  return { klass, property };
}

export type OasRouteDecoratorFactory = (path: string, guards: GuardItem[], pathItem: XPathItemObject) => OasRouteDecorator;

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
  guards: GuardItem[];
  pathItem: XPathItemObject;
}

function oasRoute(path: string, guards: GuardItem[], pathItem: XPathItemObject): OasRouteMetadata {
  return { path, guards, pathItem: pathItem };
}

/**
 * Open API Specification Route.
 */
export const OasRoute = makePropDecorator('OasRoute', oasRoute) as OasRouteDecoratorFactory;
