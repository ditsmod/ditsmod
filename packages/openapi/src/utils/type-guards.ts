import { edk } from '@ditsmod/core';

import { OasRouteMetadata } from '../decorators/oas-route';

export function isOasRoute(propMeatada: edk.AnyObj): propMeatada is OasRouteMetadata {
  return (propMeatada as any)?.ngMetadataName == 'OasRoute';
}
