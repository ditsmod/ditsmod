import { RootModule, Router } from '@ditsmod/core';
import { DefaultRouter } from '@ditsmod/router';
import { OpenApiModule } from '@ditsmod/open-api';

import { HelloWorldController } from './hello-world.controller';

@RootModule({
  imports: [OpenApiModule],
  controllers: [HelloWorldController],
  providersPerApp: [{ provide: Router, useClass: DefaultRouter }]
})
export class AppModule {}
