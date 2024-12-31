import { AnyObj, DecoratorAndValue } from '@ditsmod/core';
import { ReferenceObject } from '@ts-stack/openapi-spec';

import { property, PropertyDecoratorItem } from '#decorators/property.js';
import { oasGuard, OasGuardMetadata } from '#decorators/oas-guard.js';
import { oasRoute, OasRouteMetadata } from '#decorators/oas-route.js';

export function isOasRoute(decoratorAndValue: AnyObj): decoratorAndValue is DecoratorAndValue<OasRouteMetadata> {
  return (decoratorAndValue as DecoratorAndValue).decorator === oasRoute;
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
