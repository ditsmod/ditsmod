import { Type } from '@ts-stack/di';
import { Dictionary } from '@ditsmod/i18n';
import { OasRouteMeta } from '@ditsmod/openapi';
import { XParameterObject, XSchemaObject } from '@ts-stack/openapi-spec';

export class ValidationRouteMeta extends OasRouteMeta {
  parameters: XParameterObject[];
  requestBodyProperties: XSchemaObject;
}

/**
 * This OAS property contains validation error arguments.
 */
export const VALIDATION_ARGS = 'x-invalid-args';

/**
 * This OAS property indicates whether requestBody property is required or not.
 */
export const IS_REQUIRED = 'x-body-property-required';

export type ValidationArguments<T extends Type<Dictionary>> = [T, keyof T['prototype'], ...any[]];
