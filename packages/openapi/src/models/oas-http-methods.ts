import { edk, HttpMethod } from '@ditsmod/core';
import { InjectionToken } from '@ts-stack/di';
import { XPathsObject } from '@ts-stack/openapi-spec';

/**
 * OpenAPI Specification HTTP methods.
 */
export const OAS_HTTP_METHODS = new InjectionToken<HttpMethod[]>('OAS_HTTP_METHODS');
/**
 * OpenAPI Specification extensions group that returns `XPathsObject`.
 */
export const OAS_COMPILER_EXTENSIONS = new InjectionToken<edk.Extension<XPathsObject>[]>('OAS_COMPILER_EXTENSIONS');