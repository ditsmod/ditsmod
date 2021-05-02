import { RootModule, Router, edk } from '@ditsmod/core';
import { DefaultRouter } from '@ditsmod/router';

import { HelloWorldController } from './hello-world.controller';
import { MyExtension } from './my-extension';

@RootModule({
  controllers: [HelloWorldController],
  providersPerApp: [
    { provide: Router, useClass: DefaultRouter },
    { provide: edk.PRE_ROUTER_EXTENSIONS, useClass: MyExtension, multi: true },
  ],
  extensions: [edk.PRE_ROUTER_EXTENSIONS],
})
export class AppModule {}
