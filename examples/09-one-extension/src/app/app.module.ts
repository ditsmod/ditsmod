import { Providers, rootModule } from '@ditsmod/core';
import { PreRouterExtension, initRest } from '@ditsmod/rest';

import { HelloWorldController } from './hello-world.controller.js';
import { MyExtension } from './my-extension.js';

@initRest({
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
  extensions: [{ extension: MyExtension, beforeExtensions: [PreRouterExtension] }],
  controllers: [HelloWorldController],
})
@rootModule()
export class AppModule {}
