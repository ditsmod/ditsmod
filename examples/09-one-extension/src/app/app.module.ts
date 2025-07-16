import { Providers, rootModule } from '@ditsmod/core';
import { RestModule, PreRouterExtension, initRest } from '@ditsmod/rest';

import { HelloWorldController } from './hello-world.controller.js';
import { MyExtension } from './my-extension.js';

@initRest({ controllers: [HelloWorldController] })
@rootModule({
  imports: [RestModule],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
  extensions: [{ extension: MyExtension, beforeExtensions: [PreRouterExtension] }],
})
export class AppModule {}
