import { AnyObj } from '@ditsmod/core';
import { ReferenceObject } from '@ts-stack/openapi-spec';
import { PropertyDecoratorItem } from '../decorators/property';

import { oasGuard, OasGuardMetadata } from '../decorators/oas-guard';
import { oasRoute, OasRouteMetadata1, OasRouteMetadata2 } from '../decorators/oas-route';
import { Container } from '@ts-stack/di';

export function isOasRoute(propMeatada: AnyObj): propMeatada is (OasRouteMetadata1 | OasRouteMetadata2) {
  return propMeatada instanceof oasRoute;
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

export function isOasGuard(container: AnyObj): container is Container<OasGuardMetadata> {
  return (container as Container<OasGuardMetadata>).factory === oasGuard;
}

export function isProperty(container: AnyObj): container is Container<PropertyDecoratorItem> {
  return (container as any)?.decoratorName == 'Property';
}
