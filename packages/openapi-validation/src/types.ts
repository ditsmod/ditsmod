import { OasExtensionRouteMeta } from '@ditsmod/openapi';
import type { XParameterObject, XSchemaObject } from '@ts-stack/openapi-spec';

import type { ValidationOptions } from './validation-options.js';

export class ValidationRouteMeta extends OasExtensionRouteMeta {
  parameters: XParameterObject[];
  requestBodySchema: XSchemaObject;
  options: ValidationOptions;
}

/**
 * This OAS property contains validation error arguments.
 */
export const INVALID_ARGS = 'x-invalid-args';
