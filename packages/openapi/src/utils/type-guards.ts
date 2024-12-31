import { AnyObj, DecoratorAndValue } from '@ditsmod/core';
import { ReferenceObject } from '@ts-stack/openapi-spec';

import { property, PropertyDecoratorItem } from '#decorators/property.js';
import { oasGuard, OasGuardMetadata } from '#decorators/oas-guard.js';
import { oasRoute, OasRouteMetadata1, OasRouteMetadata2 } from '#decorators/oas-route.js';

export function isOasRoute(decoratorAndValue: AnyObj): decoratorAndValue is DecoratorAndValue<OasRouteMetadata1 | OasRouteMetadata2> {
  return (decoratorAndValue as DecoratorAndValue).decorator === oasRoute;
}

export function isOasRoute1(propMeatada: DecoratorAndValue): propMeatada is DecoratorAndValue<OasRouteMetadata1> {
  return isOasRoute(propMeatada) && (propMeatada.value as OasRouteMetadata1).guards !== undefined;
}

export function isOasRoute2(propMeatada: DecoratorAndValue): propMeatada is DecoratorAndValue<OasRouteMetadata2> {
  return isOasRoute(propMeatada) && (propMeatada.value as OasRouteMetadata2).operationObject !== undefined;
}

export function isReferenceObject(obj?: AnyObj): obj is ReferenceObject {
  return Boolean(obj?.hasOwnProperty('$ref'));
}

export function isOasGuard(decoratorsAndValues: AnyObj): decoratorsAndValues is DecoratorAndValue<OasGuardMetadata> {
  return (decoratorsAndValues as DecoratorAndValue<OasGuardMetadata>).decorator === oasGuard;
}

export function isProperty(decoratorsAndValues: any): decoratorsAndValues is DecoratorAndValue<PropertyDecoratorItem> {
  return decoratorsAndValues?.decorator == property;
}
