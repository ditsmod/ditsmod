import { ObjectAny, CanActivate } from '@ts-stack/ditsmod';
import { makePropDecorator, Type } from '@ts-stack/di';

import { OasParameter } from '../types-oas/oas-parameter';
import { OasResponse } from '../types-oas/oas-response';

export type DecoratorGuardItem = Type<CanActivate> | [Type<CanActivate>, ...any[]];

export function keyOf<T extends Type<any>>(klass: T, property: keyof T['prototype']) {
  return { klass, property };
}

/**
 * This metadata is used to validate input data and to restrict access to the routes.
 *
 * The location of the parameter.
 * There are four possible parameter locations specified by the _in_ field:
 * - `path` - Used together with [Path Templating](https://swagger.io/specification/#path-templating),
 * where the parameter value is actually part of the operation's URL.
 * This does not include the host or base path of the API. For example, in `/items/{itemId}`, the path parameter is `itemId`.
 * - `query` - Parameters that are appended to the URL. For example, in `/items?id=###`, the query parameter is `id`.
 * - `header` - Custom headers that are expected as part of the request.
 * Note that [RFC7230](https://tools.ietf.org/html/rfc7230#page-22) states header names are case insensitive.
 * - `cookie` - Used to pass a specific cookie value to the API.
 */
export class RouteSpecConfig {
  header?: OasParameter[];
  cookie?: OasParameter[];
  path?: OasParameter[];
  query?: OasParameter[];
  guards?: DecoratorGuardItem[];
  responses?: { [status: string]: OasResponse };
}

export type RouteSpecDecoratorFactory = (config: RouteSpecConfig) => RouteSpecDecorator;

export type RouteSpecDecorator = <T>(
  target: ObjectAny,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<T>
) => RouteSpecDecoratorMetadata;

export interface RouteSpecDecoratorMetadata {
  [key: string]: RouteSpecMetadata[];
}

export interface RouteSpecMetadata {
  configs: RouteSpecConfig[];
}
/**
 * @param config description here
 */
function routeSpec(configs: RouteSpecConfig[]): RouteSpecMetadata {
  return { configs };
}

export const RouteSpec = makePropDecorator('RouteSpec', routeSpec) as RouteSpecDecoratorFactory;
