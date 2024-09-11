import { Providers, rootModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { HelloWorldController } from './hello-world.controller.js';
import { HelloWorldController2 } from './hello-world.controller2.js';

@rootModule({
  imports: [RoutingModule],
  controllers: [HelloWorldController, HelloWorldController2]
})
export class AppModule {}
