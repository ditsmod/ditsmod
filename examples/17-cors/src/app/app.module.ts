import { Providers, rootModule } from '@ditsmod/core';
import { initRest, RestModule } from '@ditsmod/rest';
import { CorsModule } from '@ditsmod/cors';

import { FirstController, SecondController } from './controllers.js';

@initRest({ controllers: [FirstController, SecondController] })
@rootModule({
  imports: [RestModule, CorsModule.withParams({ origin: 'https://example.com' })],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
