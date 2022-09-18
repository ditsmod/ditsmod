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
export const INVALID_ARGS_KEY = 'x-invalid-args';

/**
 * This OAS property indicates whether requestBody property is required or not.
 */
export const IS_REQUIRED = 'x-body-property-required';

export type InvalidArgsValue<T extends Type<Dictionary>> = [T, keyof T['prototype'], ...any[]];

interface ValidArgsObj<T extends Type<Dictionary>> {
  [INVALID_ARGS_KEY]: InvalidArgsValue<T>;
}

export function getInvalidArgs<T extends Type<Dictionary>, K extends keyof Omit<T['prototype'], 'getLng'>>(
  dict: T,
  key: Exclude<keyof T['prototype'], 'getLng'>,
  ...args: Parameters<T['prototype'][K]>
): ValidArgsObj<T> {
  return { [INVALID_ARGS_KEY]: [dict, key, ...args] };
}
