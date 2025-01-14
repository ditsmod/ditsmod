import { Providers, rootModule } from '@ditsmod/core';
import { RoutingModule, PreRouterExtension } from '@ditsmod/routing';

import { HelloWorldController } from './hello-world.controller.js';
import { MyExtension } from './my-extension.js';

@rootModule({
  imports: [RoutingModule],
  controllers: [HelloWorldController],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
  extensions: [{ extension: MyExtension, beforeExtensions: [PreRouterExtension] }],
})
export class AppModule {}
