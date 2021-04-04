import { RootModule, Router } from '@ditsmod/core';
import { DefaultRouter } from '@ditsmod/router';
import { OpenapiModule } from '@ditsmod/openapi';

import { HelloWorldController } from './hello-world.controller';

@RootModule({
  imports: [OpenapiModule],
  controllers: [HelloWorldController],
  providersPerApp: [{ provide: Router, useClass: DefaultRouter }]
})
export class AppModule {}
