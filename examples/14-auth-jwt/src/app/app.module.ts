import { Providers, rootModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { HelloWorldController } from './hello-world.controller.js';
import { AuthModule } from './modules/services/auth/auth.module.js';

@initRest({
  controllers: [HelloWorldController],
})
@rootModule({
  imports: [AuthModule.withPath('')],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
