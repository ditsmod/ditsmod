import { Class, DecoratorAndValue, InjectionToken } from '@ditsmod/core';

import { route } from './decorators/route.js';
import { HttpInterceptor } from '#mod/interceptors/tokens-and-types.js';

export function isRoute<T>(decoratorAndValue?: DecoratorAndValue<T>): decoratorAndValue is DecoratorAndValue<T> {
  return (decoratorAndValue as DecoratorAndValue<T>)?.decorator === route;
}

export function isInterceptor(cls?: Class): cls is Class<HttpInterceptor> {
  return typeof (cls?.prototype as HttpInterceptor | undefined)?.intercept == 'function';
}
