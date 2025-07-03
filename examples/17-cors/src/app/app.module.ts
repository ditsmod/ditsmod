import { Providers, rootModule } from '@ditsmod/core';
import { RestModule } from '@ditsmod/rest';
import { CorsModule } from '@ditsmod/cors';

import { FirstController, SecondController } from './controllers.js';

@rootModule({
  imports: [RestModule, CorsModule.withParams({ origin: 'https://example.com' })],
  controllers: [FirstController, SecondController],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
