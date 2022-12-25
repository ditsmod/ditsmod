import { ExtensionsMetaPerApp } from '@ditsmod/core';
import { OpenapiModule, SwaggerOAuthOptions } from '@ditsmod/openapi';

import { oasObject } from './oas-object';
import { oasOptions } from './oas-options';

const swaggerOAuthOptions: SwaggerOAuthOptions = {
  appName: 'Swagger UI Webpack Demo',
  // See https://demo.duendesoftware.com/ for configuration details.
  clientId: 'implicit',
};

export const openapiModuleWithParams = OpenapiModule.withParams(oasObject, '', swaggerOAuthOptions);

openapiModuleWithParams.providersPerApp = [
  ...(openapiModuleWithParams.providersPerApp || []),
  { token: ExtensionsMetaPerApp, useValue: { oasOptions } },
];
