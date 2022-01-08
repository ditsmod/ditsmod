import { Extension } from '@ditsmod/core';
import { InjectionToken } from '@ts-stack/di';
import { XOasObject } from '@ts-stack/openapi-spec';

/**
 * OpenAPI Specification extensions group that returns `XOasObject`.
 */
export const OAS_COMPILER_EXTENSIONS = new InjectionToken<Extension<XOasObject | false>[]>('OAS_COMPILER_EXTENSIONS');
/**
 * OpenAPI Specification DI token used to pass value with `OasObject`.
 */
export const OAS_OBJECT = new InjectionToken<XOasObject>('OAS_OBJECT');
