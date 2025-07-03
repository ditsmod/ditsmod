import { Providers, rootModule } from '@ditsmod/core';
import { RestModule } from '@ditsmod/rest';

import { HelloWorldController } from './hello-world.controller.js';
import { AuthModule } from './modules/services/auth/auth.module.js';

@rootModule({
  imports: [RestModule, { path: '', module: AuthModule }],
  controllers: [HelloWorldController],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
