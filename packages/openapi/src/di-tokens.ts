import { Extension } from '@ditsmod/core';
import { InjectionToken } from '@ditsmod/core';
import { XOasObject } from '@ts-stack/openapi-spec';

/**
 * OpenAPI Specification extensions group that returns `XOasObject`.
 */
export const OAS_COMPILER_EXTENSIONS = new InjectionToken<Extension<XOasObject | false>[]>('OAS_COMPILER_EXTENSIONS');
