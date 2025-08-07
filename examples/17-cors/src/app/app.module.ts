import { Providers, rootModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';
import { CorsModule } from '@ditsmod/cors';

import { FirstController, SecondController } from './controllers.js';

@initRest({
  imports: [CorsModule.withParams({ origin: 'https://example.com' })],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
  controllers: [FirstController, SecondController],
})
@rootModule()
export class AppModule {}
