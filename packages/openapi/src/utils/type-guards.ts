import { AnyObj } from '@ditsmod/core';
import { ReferenceObject } from '@ts-stack/openapi-spec';
import { ColumnDecoratorItem } from '../decorators/column';

import { OasGuardMetadata } from '../decorators/oas-guard';
import { OasRouteMetadata1, OasRouteMetadata2 } from '../decorators/oas-route';

export function isOasRoute(propMeatada: AnyObj): propMeatada is (OasRouteMetadata1 | OasRouteMetadata2) {
  return (propMeatada as any)?.ngMetadataName == 'OasRoute';
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
  return (classMeta as any)?.ngMetadataName == 'OasGuard';
}

export function isColumn(propertyMeta: AnyObj): propertyMeta is ColumnDecoratorItem {
  return (propertyMeta as any)?.ngMetadataName == 'Column';
}
