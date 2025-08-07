import { Providers, rootModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { HelloWorldController } from './hello-world.controller.js';
import { AuthModule } from './modules/services/auth.module.js';

@initRest({
  imports: [AuthModule.withPath('')],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
  controllers: [HelloWorldController],
})
@rootModule()
export class AppModule {}
