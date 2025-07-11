import { Providers, rootModule } from '@ditsmod/core';
import { addRest, RestModule } from '@ditsmod/rest';

import { HelloWorldController } from './hello-world.controller.js';
import { MyService } from './my.service.js';
import { OtherService } from './other.service.js';
import { Controller1 } from './bad.controllers.js';

@addRest({ controllers: [HelloWorldController, Controller1], providersPerReq: [MyService, OtherService] })
@rootModule({
  imports: [RestModule],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
