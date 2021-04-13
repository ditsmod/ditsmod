import { HttpMethod } from '@ditsmod/core';
import { InjectionToken } from '@ts-stack/di';

/**
 * OpenAPI Specification HTTP methods.
 */
export const OAS_HTTP_METHODS = new InjectionToken<HttpMethod[]>('OAS_HTTP_METHODS');