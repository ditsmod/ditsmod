import { edk, HttpMethod } from '@ditsmod/core';
import { InjectionToken } from '@ts-stack/di';
import { XOasObject } from '@ts-stack/openapi-spec';

/**
 * OpenAPI Specification DI token used to pass values with HTTP methods.
 */
export const OAS_HTTP_METHODS = new InjectionToken<HttpMethod[]>('OAS_HTTP_METHODS');
/**
 * OpenAPI Specification extensions group that returns `XOasObject`.
 */
export const OAS_COMPILER_EXTENSIONS = new InjectionToken<edk.Extension<XOasObject>[]>('OAS_COMPILER_EXTENSIONS');
/**
 * OpenAPI Specification DI token used to pass value with `OasObject`.
 */
export const OAS_OBJECT = new InjectionToken<XOasObject>('OAS_OBJECT');
