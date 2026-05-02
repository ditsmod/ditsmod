import { Providers } from '@ditsmod/core';
import { PreRouterExtension, RouteExtension, restRootModule } from '@ditsmod/rest';

import { HelloWorldController } from './hello-world.controller.js';
import { MyExtension } from './my-extension.js';

@restRootModule({
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
  extensions: [{ extension: MyExtension, afterExtensions: [RouteExtension], beforeExtensions: [PreRouterExtension] }],
  controllers: [HelloWorldController],
})
export class AppModule {}
