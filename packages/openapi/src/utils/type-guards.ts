import { AnyObj } from '@ditsmod/core';
import { ReferenceObject } from '@ts-stack/openapi-spec';
import { DecoratorAndValue } from '@ditsmod/core';

import { property, PropertyDecoratorItem } from '#decorators/property.js';
import { oasGuard, OasGuardMetadata } from '#decorators/oas-guard.js';
import { oasRoute, OasRouteDecoratorMetadata, OasRouteMetadata1, OasRouteMetadata2 } from '#decorators/oas-route.js';

export function isOasRoute(propMeatada: AnyObj): propMeatada is OasRouteDecoratorMetadata {
  return (propMeatada as OasRouteDecoratorMetadata).decorator === oasRoute;
}

export function isOasRoute1(
  propMeatada: OasRouteDecoratorMetadata
): propMeatada is OasRouteDecoratorMetadata<OasRouteMetadata1> {
  return isOasRoute(propMeatada) && (propMeatada.value as OasRouteMetadata1).guards !== undefined;
}

export function isOasRoute2(
  propMeatada: OasRouteDecoratorMetadata
): propMeatada is OasRouteDecoratorMetadata<OasRouteMetadata2> {
  return isOasRoute(propMeatada) && (propMeatada.value as OasRouteMetadata2).operationObject !== undefined;
}

export function isReferenceObject(obj?: AnyObj): obj is ReferenceObject {
  return Boolean(obj?.hasOwnProperty('$ref'));
}

export function isOasGuard(decoratorsAndValues: AnyObj): decoratorsAndValues is DecoratorAndValue<OasGuardMetadata> {
  return (decoratorsAndValues as DecoratorAndValue<OasGuardMetadata>).decorator === oasGuard;
}

export function isProperty(
  decoratorsAndValues: any
): decoratorsAndValues is DecoratorAndValue<PropertyDecoratorItem> {
  return decoratorsAndValues?.decorator == property;
}
