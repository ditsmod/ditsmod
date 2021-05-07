import { edk, GuardItem, HttpMethod } from '@ditsmod/core';
import { makePropDecorator } from '@ts-stack/di';
import { XOperationObject } from '@ts-stack/openapi-spec';

export type OasRouteDecoratorFactory = (
  httpMethod: HttpMethod,
  path?: string,
  guards?: GuardItem[],
  operationObject?: XOperationObject
) => OasRouteDecorator;

export type OasRouteDecorator = <T>(
  target: edk.AnyObj,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<T>
) => OasRouteDecoratorMetadata;

export interface OasRouteDecoratorMetadata {
  [key: string]: OasRouteMetadata[];
}

export interface OasRouteMetadata {
  httpMethod: HttpMethod;
  path?: string;
  guards?: GuardItem[];
  /**
   * OAS `OperationObject`.
   */
  operationObject?: XOperationObject;
}

function oasRoute(
  httpMethod: HttpMethod,
  path: string,
  guards: GuardItem[],
  operationObject: XOperationObject
): OasRouteMetadata {
  return { httpMethod, path, guards, operationObject };
}

/**
 * Open API Specification Route.
 */
export const OasRoute = makePropDecorator('OasRoute', oasRoute) as OasRouteDecoratorFactory;
