import { edk } from '@ditsmod/core';
import { ReferenceObject, XSchemaObject } from '@ts-stack/openapi-spec';

import { OasGuardMetadata } from '../decorators/oas-guard';
import { OasRouteMetadata } from '../decorators/oas-route';

export function isOasRoute(propMeatada: edk.AnyObj): propMeatada is OasRouteMetadata {
  return (propMeatada as any)?.ngMetadataName == 'OasRoute';
}

export function isReferenceObject(obj: edk.AnyObj): obj is ReferenceObject {
  return obj.hasOwnProperty('$ref');
}

export function isOasGuard(classMeatada: edk.AnyObj): classMeatada is OasGuardMetadata {
  return (classMeatada as any)?.ngMetadataName == 'OasGuard';
}

export function isColumn(propertyMeta: edk.AnyObj): propertyMeta is XSchemaObject {
  return (propertyMeta as any)?.ngMetadataName == 'Column';
}
