import { OpenapiModule } from '@ditsmod/openapi';

import { oasObject } from './oas-object';

export const openapiModuleWithParams = OpenapiModule.withParams(oasObject, '');
