import { makePropDecorator } from '@ts-stack/di';

import { ObjectAny } from '../types/types';
import { HttpMethod } from '../types/router';

export interface RouteMetadata {
  httpMethod: HttpMethod;
  path: string;
}

export interface RouteDecoratorMetadata {
  [methodName: string]: RouteMetadata[];
}

export type RouteDecorator = <T>(
  target: ObjectAny,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<T>
) => RouteDecoratorMetadata;
function route(httpMethod: HttpMethod, path: string = ''): RouteMetadata {
  return { httpMethod, path };
}

export type RouteDecoratorFactory = (method: HttpMethod, path?: string) => RouteDecorator;
export const Route = makePropDecorator('Route', route) as RouteDecoratorFactory;
