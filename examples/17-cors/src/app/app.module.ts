import { Providers, rootModule } from '@ditsmod/core';
import { addRest, RestModule } from '@ditsmod/rest';
import { CorsModule } from '@ditsmod/cors';

import { FirstController, SecondController } from './controllers.js';

@addRest({ controllers: [FirstController, SecondController] })
@rootModule({
  imports: [RestModule, CorsModule.withParams({ origin: 'https://example.com' })],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
