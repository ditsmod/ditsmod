import { RootModule, Router, edk } from '@ditsmod/core';
import { DefaultRouter } from '@ditsmod/router';

import { HelloWorldController } from './hello-world.controller';
import { MyExtension } from './my-extension';

@RootModule({
  controllers: [HelloWorldController],
  providersPerApp: [
    { provide: Router, useClass: DefaultRouter },
    { provide: edk.VOID_EXTENSIONS, useClass: MyExtension, multi: true },
  ],
  extensions: [edk.VOID_EXTENSIONS],
})
export class AppModule {}
