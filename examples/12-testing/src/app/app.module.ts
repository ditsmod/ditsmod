import { Providers } from '@ditsmod/core';
import { restRootModule } from '@ditsmod/rest';

import { HelloWorldController } from './hello-world.controller.js';
import { MyService } from './my.service.js';
import { OtherService } from './other.service.js';
import { Controller1 } from './bad.controllers.js';

@restRootModule({
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
  controllers: [HelloWorldController, Controller1],
  providersPerReq: [MyService, OtherService],
})
export class AppModule {}
