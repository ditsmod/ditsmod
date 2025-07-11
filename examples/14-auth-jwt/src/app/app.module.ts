import { Providers, rootModule } from '@ditsmod/core';
import { addRest, RestModule } from '@ditsmod/rest';

import { HelloWorldController } from './hello-world.controller.js';
import { AuthModule } from './modules/services/auth/auth.module.js';

@addRest({
  importsWithParams: [{ modRefId: AuthModule, path: '' }],
  controllers: [HelloWorldController],
})
@rootModule({
  imports: [RestModule],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
