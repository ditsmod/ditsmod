import { AnyObj } from '@ditsmod/core';
import { ReferenceObject } from '@ts-stack/openapi-spec';
import { PropertyDecoratorItem } from '../decorators/property';

import { OasGuard, OasGuardMetadata } from '../decorators/oas-guard';
import { OasRoute, OasRouteMetadata1, OasRouteMetadata2 } from '../decorators/oas-route';

export function isOasRoute(propMeatada: AnyObj): propMeatada is (OasRouteMetadata1 | OasRouteMetadata2) {
  return propMeatada instanceof OasRoute;
}

export function isOasRoute1(propMeatada: AnyObj): propMeatada is OasRouteMetadata1 {
  return isOasRoute(propMeatada) && (propMeatada as OasRouteMetadata1).guards !== undefined;
}

export function isOasRoute2(propMeatada: AnyObj): propMeatada is OasRouteMetadata2 {
  return isOasRoute(propMeatada) && (propMeatada as OasRouteMetadata2).operationObject !== undefined;
}

export function isReferenceObject(obj?: AnyObj): obj is ReferenceObject {
  return Boolean(obj?.hasOwnProperty('$ref'));
}

export function isOasGuard(classMeta: AnyObj): classMeta is OasGuardMetadata {
  return classMeta instanceof OasGuard;
}

export function isProperty(propertyMeta: AnyObj): propertyMeta is PropertyDecoratorItem {
  return (propertyMeta as any)?.decoratorName == 'Property';
}
