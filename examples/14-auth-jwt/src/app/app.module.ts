import { Providers } from '@ditsmod/core';
import { restRootModule } from '@ditsmod/rest';

import { HelloWorldController } from './hello-world.controller.js';
import { AuthModule } from './modules/services/auth.module.js';

@restRootModule({
  imports: [{ path: '', module: AuthModule }],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
  controllers: [HelloWorldController],
})
export class AppModule {}
