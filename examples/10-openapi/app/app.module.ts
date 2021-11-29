import { RootModule, ServiceProvider } from '@ditsmod/core';
import { OAS_OBJECT, OpenapiModule, SwaggegrOAuthOptions } from '@ditsmod/openapi';
import { RouterModule } from '@ditsmod/router';

import { FirstModule } from './modules/routed/first.module';
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
const openapiModuleWithParams = OpenapiModule.withParams(providersPerApp);

@RootModule({
  // Here works the application and serves OpenAPI documentation.
  listenOptions: { host: 'localhost', port: 8080 },
  imports: [RouterModule, openapiModuleWithParams, FirstModule],
  exports: [openapiModuleWithParams]
})
export class AppModule {}
