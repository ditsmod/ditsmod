import { RootModule, Router } from '@ditsmod/core';
import { DefaultRouter } from '@ditsmod/router';

import { HelloWorldController } from './hello-world.controller';

@RootModule({
  controllers: [HelloWorldController],
  providersPerApp: [{ provide: Router, useClass: DefaultRouter }]
})
export class AppModule {}
