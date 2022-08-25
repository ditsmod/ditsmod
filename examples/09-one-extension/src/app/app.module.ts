import { PRE_ROUTER_EXTENSIONS, RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { HelloWorldController } from './hello-world.controller';
import { MyExtension } from './my-extension';

@RootModule({
  imports: [RouterModule],
  controllers: [HelloWorldController],
  extensions: [
    [PRE_ROUTER_EXTENSIONS, MyExtension],
  ],
})
export class AppModule {}
