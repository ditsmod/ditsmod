import { AnyObj } from '@ditsmod/core';
import { ReferenceObject } from '@ts-stack/openapi-spec';
import { property, PropertyDecoratorItem } from '../decorators/property';
import { Container } from '@ditsmod/core';

import { oasGuard, OasGuardMetadata } from '../decorators/oas-guard';
import { oasRoute, OasRouteDecoratorMetadata, OasRouteMetadata1, OasRouteMetadata2 } from '../decorators/oas-route';

export function isOasRoute(propMeatada: AnyObj): propMeatada is OasRouteDecoratorMetadata {
  return (propMeatada as OasRouteDecoratorMetadata).decoratorFactory === oasRoute;
}

export function isOasRoute1(propMeatada: AnyObj): propMeatada is OasRouteMetadata1 {
  return isOasRoute(propMeatada) && (propMeatada.value as OasRouteMetadata1).guards !== undefined;
}

export function isOasRoute2(propMeatada: AnyObj): propMeatada is OasRouteMetadata2 {
  return isOasRoute(propMeatada) && (propMeatada.value as OasRouteMetadata2).operationObject !== undefined;
}

export function isReferenceObject(obj?: AnyObj): obj is ReferenceObject {
  return Boolean(obj?.hasOwnProperty('$ref'));
}

export function isOasGuard(container: AnyObj): container is Container<OasGuardMetadata> {
  return (container as Container<OasGuardMetadata>).factory === oasGuard;
}

export function isProperty(container: any): container is Container<PropertyDecoratorItem> {
  return container?.factory == property;
}
