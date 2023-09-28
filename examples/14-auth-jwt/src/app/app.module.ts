import { rootModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { HelloWorldController } from './hello-world.controller.js';
import { AuthModule } from './modules/services/auth/auth.module.js';

@rootModule({
  imports: [RoutingModule, { path: '', module: AuthModule }],
  controllers: [HelloWorldController],
})
export class AppModule {}
