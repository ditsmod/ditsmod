import { RootModule, edk } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { HelloWorldController } from './hello-world.controller';
import { MyExtension } from './my-extension';

@RootModule({
  imports: [RouterModule],
  controllers: [HelloWorldController],
  extensions: [
    { provide: edk.PRE_ROUTER_EXTENSIONS, useClass: MyExtension, multi: true },
  ],
  exports: [edk.PRE_ROUTER_EXTENSIONS],
})
export class AppModule {}
