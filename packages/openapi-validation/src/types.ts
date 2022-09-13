import { OasRouteMeta } from '@ditsmod/openapi';
import { XParameterObject, XSchemaObject } from '@ts-stack/openapi-spec';

export class ValidationRouteMeta extends OasRouteMeta {
  parameters: XParameterObject[];
  requestBodyProperties: XSchemaObject;
}

/**
 * This OAS property contains validation error arguments.
 */
export const VALIDATION_ARGS = 'x-validation-args';

/**
 * This OAS property indicates whether requestBody property is required or not.
 */
export const IS_REQUIRED = 'x-body-property-required';
