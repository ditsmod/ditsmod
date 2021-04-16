import { RootModule, Router, ServiceProvider } from '@ditsmod/core';
import { DefaultRouter } from '@ditsmod/router';
import { OAS_OBJECT, OpenapiModule } from '@ditsmod/openapi';
import { XOasObject } from '@ts-stack/openapi-spec';

import { HelloWorldController } from './hello-world.controller';

const oasObject: XOasObject = { openapi: '3.0.0', info: { title: 'Testing @ditsmod/openapi', version: '1.0.0' } };
const providersPerApp: ServiceProvider[] = [{ provide: OAS_OBJECT, useValue: oasObject }];
const openapiModuleWithParams = OpenapiModule.withParams(providersPerApp);

@RootModule({
  imports: [openapiModuleWithParams],
  controllers: [HelloWorldController],
  providersPerApp: [{ provide: Router, useClass: DefaultRouter }]
})
export class AppModule {}
