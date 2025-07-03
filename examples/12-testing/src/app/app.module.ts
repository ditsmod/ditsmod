import { Providers, rootModule } from '@ditsmod/core';
import { RestModule } from '@ditsmod/rest';

import { HelloWorldController } from './hello-world.controller.js';
import { MyService } from './my.service.js';
import { OtherService } from './other.service.js';
import { Controller1 } from './bad.controllers.js';

@rootModule({
  imports: [RestModule],
  controllers: [HelloWorldController, Controller1],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
  providersPerReq: [MyService, OtherService]
})
export class AppModule {}
