import { rootModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { HelloWorldController } from './hello-world.controller.js';
import { MyService } from './my.service.js';
import { OtherService } from './other.service.js';
import { Controller1 } from './bad.controllers.js';

@rootModule({
  imports: [RoutingModule],
  controllers: [HelloWorldController, Controller1],
  providersPerReq: [MyService, OtherService]
})
export class AppModule {}
