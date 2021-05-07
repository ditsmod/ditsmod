import { XParameterObject, ReferenceObject } from '@ts-stack/openapi-spec';

/**
 * Applies to importing `OasModuleWithParams`.
 */
export interface OasOptions {
  paratemers?: (XParameterObject | ReferenceObject)[];
  tags?: string[];
}
