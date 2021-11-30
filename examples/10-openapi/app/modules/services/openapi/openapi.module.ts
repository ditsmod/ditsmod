import { ServiceProvider } from '@ditsmod/core';
import { OAS_OBJECT, OpenapiModule, SwaggegrOAuthOptions } from '@ditsmod/openapi';

import { oasObject } from './oas-object';

const swaggerOAuthOptions: SwaggegrOAuthOptions = {
  appName: 'Swagger UI Webpack Demo',
  // See https://demo.identityserver.io/ for configuration details.
  clientId: 'implicit',
};
const providersPerApp: ServiceProvider[] = [
  { provide: OAS_OBJECT, useValue: oasObject },
  { provide: SwaggegrOAuthOptions, useValue: swaggerOAuthOptions },
];
export const openapiModuleWithParams = OpenapiModule.withParams(providersPerApp);
