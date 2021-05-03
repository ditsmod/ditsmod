import { edk } from '@ditsmod/core';
import { InjectionToken } from '@ts-stack/di';
import { XOasObject } from '@ts-stack/openapi-spec';

/**
 * OpenAPI Specification extensions group that returns `XOasObject`.
 */
export const OAS_COMPILER_EXTENSIONS = new InjectionToken<edk.Extension<XOasObject>[]>('OAS_COMPILER_EXTENSIONS');
/**
 * OpenAPI Specification DI token used to pass value with `OasObject`.
 */
export const OAS_OBJECT = new InjectionToken<XOasObject>('OAS_OBJECT');
/**
 * OpenAPI Specification extensions group that returns `void`.
 * 
 * This extensions group should patch metadata to works OAS features.
 */
export const OAS_PATCH_METADATA_EXTENSIONS = new InjectionToken<edk.Extension<void>[]>('OAS_PATCH_METADATA_EXTENSIONS');
