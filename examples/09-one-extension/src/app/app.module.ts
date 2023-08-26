import { PRE_ROUTER_EXTENSIONS, rootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { HelloWorldController } from './hello-world.controller.js';
import { MyExtension } from './my-extension.js';

@rootModule({
  imports: [RouterModule],
  controllers: [HelloWorldController],
  extensions: [{ extension: MyExtension, groupToken: PRE_ROUTER_EXTENSIONS }],
})
export class AppModule {}
