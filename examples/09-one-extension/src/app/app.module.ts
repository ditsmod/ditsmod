import { Providers } from '@ditsmod/core';
import { PreRouterExtension, RestRouteExtension, restRootModule } from '@ditsmod/rest';

import { HelloWorldController } from './hello-world.controller.js';
import { MyExtension } from './my-extension.js';

@restRootModule({
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
  extensions: [{ extension: MyExtension, afterExtensions: [RestRouteExtension], beforeExtensions: [PreRouterExtension] }],
  controllers: [HelloWorldController],
})
export class AppModule {}
