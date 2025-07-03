import { Providers, rootModule } from '@ditsmod/core';
import { RestModule, PreRouterExtension } from '@ditsmod/rest';

import { HelloWorldController } from './hello-world.controller.js';
import { MyExtension } from './my-extension.js';

@rootModule({
  imports: [RestModule],
  controllers: [HelloWorldController],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
  extensions: [{ extension: MyExtension, beforeExtensions: [PreRouterExtension] }],
})
export class AppModule {}
