import { makePropDecorator } from 'ts-di';

import { ObjectAny } from '../types/types';
import { HttpMethod } from '../types/router';

export type RouteDecoratorFactory = (method: HttpMethod, path?: string) => RouteDecorator;

export type RouteDecorator = <T>(
  target: ObjectAny,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<T>
) => RouteDecoratorMetadata;

export interface RouteDecoratorMetadata {
  [key: string]: RouteMetadata[];
}

export interface RouteMetadata {
  httpMethod: HttpMethod;
  path: string;
}

function route(httpMethod: HttpMethod, path: string = ''): RouteMetadata {
  return { httpMethod, path };
}

export const Route = makePropDecorator('Route', route) as RouteDecoratorFactory;
