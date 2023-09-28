import { Providers, rootModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { HelloWorldController } from './hello-world.controller.js';

@rootModule({
  imports: [RoutingModule],
  controllers: [HelloWorldController],
  providersPerApp: [...new Providers().useLogConfig({ level: 'info' })],
})
export class AppModule {}
