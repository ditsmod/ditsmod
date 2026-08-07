import type { SwaggerOAuthOptions } from '@holu/openapi';
import { OpenapiModule } from '@holu/openapi';
import { oasObject } from './oas-object.js';

const swaggerOAuthOptions: SwaggerOAuthOptions = {
  appName: 'Swagger UI Demo',
  // See https://demo.duendesoftware.com/ for configuration details.
  clientId: 'implicit',
};

export const openapiDynamicModule = OpenapiModule.withOpts(oasObject, '', swaggerOAuthOptions);
