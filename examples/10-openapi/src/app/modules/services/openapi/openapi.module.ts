import { OpenapiModule } from '@ditsmod/openapi';

import { oasObject } from './oas-object.js';

export const openapiModuleWithParams = OpenapiModule.withParams(oasObject, '');
