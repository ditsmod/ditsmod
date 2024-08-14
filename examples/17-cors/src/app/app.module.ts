import { Providers, rootModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';
import { CorsModule } from '@ditsmod/cors';

import { FirstController, SecondController } from './controllers.js';

@rootModule({
  imports: [RoutingModule, CorsModule.withParams({ origin: 'https://example.com' })],
  controllers: [FirstController, SecondController],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
