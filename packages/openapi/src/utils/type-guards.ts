import type { AnyObj, DecoratorAndValue } from '@ditsmod/core';
import type { ReferenceObject } from '@ts-stack/openapi-spec';

import type { PropertyDecoratorItem } from '#decorators/property.js';
import { property } from '#decorators/property.js';
import type { OasGuardMetadata } from '#decorators/oas-guard.js';
import { oasGuard } from '#decorators/oas-guard.js';
import type { OasRouteMetadata } from '#decorators/oas-route.js';
import { oasRoute } from '#decorators/oas-route.js';

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
