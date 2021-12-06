import { RootModule, edk } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { HelloWorldController } from './hello-world.controller';
import { MyExtension } from './my-extension';

@RootModule({
  imports: [RouterModule],
  controllers: [HelloWorldController],
  extensions: [
    [edk.PRE_ROUTER_EXTENSIONS, MyExtension],
  ],
})
export class AppModule {}
