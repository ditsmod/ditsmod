import { XParameterObject, ReferenceObject } from '@ts-stack/openapi-spec';
import { SchemaOptions } from 'yaml';

/**
 * Related to OpenAPI documentation, passed in the module metadata in the `oasOptions` property,
 * used for centrally adding `paratemers`, `tags` and `yamlSchemaOptions` to `@OasRoute()` in the current module.
 */
export interface OasOptions {
  paratemers?: (XParameterObject | ReferenceObject)[];
  tags?: string[];
  yamlSchemaOptions?: SchemaOptions
}
