import { Providers, rootModule } from '@ditsmod/core';
import { RoutingModule, PRE_ROUTER_EXTENSIONS } from '@ditsmod/routing';

import { HelloWorldController } from './hello-world.controller.js';
import { MyExtension } from './my-extension.js';

@rootModule({
  imports: [RoutingModule],
  controllers: [HelloWorldController],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
  extensions: [{ extension: MyExtension, token: PRE_ROUTER_EXTENSIONS }],
})
export class AppModule {}
