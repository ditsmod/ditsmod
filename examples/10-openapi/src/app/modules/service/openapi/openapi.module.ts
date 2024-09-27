import { OpenapiModule, SwaggerOAuthOptions } from '@ditsmod/openapi';

import { oasObject } from './oas-object.js';

const swaggerOAuthOptions: SwaggerOAuthOptions = {
  appName: 'Swagger UI Webpack Demo',
  // See https://demo.duendesoftware.com/ for configuration details.
  clientId: 'implicit',
};

export const openapiModuleWithParams = OpenapiModule.withParams(oasObject, '', swaggerOAuthOptions);
