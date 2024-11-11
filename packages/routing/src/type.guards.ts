import { DecoratorAndValue } from '@ditsmod/core';
import { route } from './decorators/route.js';

export function isRoute<T>(decoratorAndValue?: DecoratorAndValue<T>): decoratorAndValue is DecoratorAndValue<T> {
  return (decoratorAndValue as DecoratorAndValue<T>)?.decorator === route;
}
