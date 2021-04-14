import { edk } from '@ditsmod/core';
import { ReferenceObject } from '@ts-stack/openapi-spec';

import { OasRouteMetadata } from '../decorators/oas-route';

export function isOasRoute(propMeatada: edk.AnyObj): propMeatada is OasRouteMetadata {
  return (propMeatada as any)?.ngMetadataName == 'OasRoute';
}

export function isReferenceObject(obj: edk.AnyObj): obj is ReferenceObject {
  return obj.hasOwnProperty('$ref');
}
