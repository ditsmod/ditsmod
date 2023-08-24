import { ExtensionsMetaPerApp } from '@ditsmod/core';
import { OpenapiModule } from '@ditsmod/openapi';

import { oasObject } from './oas-object';
import { oasOptions } from './oas-options';

export const openapiModuleWithParams = OpenapiModule.withParams(oasObject, '');

openapiModuleWithParams.providersPerApp = [
  ...(openapiModuleWithParams.providersPerApp || []),
  { token: ExtensionsMetaPerApp, useValue: { oasOptions } },
];
