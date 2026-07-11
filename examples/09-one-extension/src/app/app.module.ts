import { LoggerConfig, ProviderBuilder } from '@ditsmod/core';
import { DispatcherExtension, RestRouteExtension, restRootModule } from '@ditsmod/rest';

import { HelloWorldController } from './hello-world.controller.js';
import { MyExtension } from './my-extension.js';

@restRootModule({
  providersPerApp: new ProviderBuilder().useValue(LoggerConfig, { level: 'info' }),
  extensions: [
    { extension: MyExtension, afterExtensions: [RestRouteExtension], beforeExtensions: [DispatcherExtension] },
  ],
  controllers: [HelloWorldController],
})
export class AppModule {}
