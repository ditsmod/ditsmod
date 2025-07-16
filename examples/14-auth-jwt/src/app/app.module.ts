import { Providers, rootModule } from '@ditsmod/core';
import { initRest, RestModule } from '@ditsmod/rest';

import { HelloWorldController } from './hello-world.controller.js';
import { AuthModule } from './modules/services/auth/auth.module.js';

@initRest({
  importsWithParams: [{ modRefId: AuthModule, path: '' }],
  controllers: [HelloWorldController],
})
@rootModule({
  imports: [RestModule],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
