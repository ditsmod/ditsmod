import { ExtensionMetaMap } from '@ditsmod/core';
import { OpenapiModule } from '@ditsmod/openapi';

import { oasObject } from './oas-object.js';
import { oasOptions } from './oas-options.js';

export const openapiDynamicModule = OpenapiModule.withOpts(oasObject, '');

openapiDynamicModule.providersPerApp = [
  ...(openapiDynamicModule.providersPerApp || []),
  { token: ExtensionMetaMap, useValue: { oasOptions } },
];
