import { RootModule, Router, ServiceProvider } from '@ditsmod/core';
import { DefaultRouter } from '@ditsmod/router';
import { OAS_OBJECT, OpenapiModule } from '@ditsmod/openapi';

import { HelloWorldController } from './hello-world.controller';
import { oasObject } from './oas-object';

const providersPerApp: ServiceProvider[] = [{ provide: OAS_OBJECT, useValue: oasObject }];
const openapiModuleWithParams = OpenapiModule.withParams(providersPerApp);

@RootModule({
  // Here works the application and serves OpenAPI documentation.
  listenOptions: { host: 'localhost', port: 8080 },
  imports: [openapiModuleWithParams],
  exports: [openapiModuleWithParams],
  controllers: [HelloWorldController],
  providersPerApp: [{ provide: Router, useClass: DefaultRouter }],
})
export class AppModule {}
