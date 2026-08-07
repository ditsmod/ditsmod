import { OpenapiModule, OasOptions } from '@holu/openapi';

import { oasObject } from './oas-object.js';
import { oasOptions } from './oas-options.js';

export const openapiDynamicModule = OpenapiModule.withOpts(oasObject, '');

openapiDynamicModule.providersPerApp = [
  ...(openapiDynamicModule.providersPerApp || []),
  { token: OasOptions, useValue: oasOptions },
];
