import { LoggerConfig, ProviderBuilder } from '@holu/core';
import { restRootModule } from '@holu/rest';
import { CorsModule } from '@holu/cors';

import { FirstController, SecondController } from './controllers.js';

@restRootModule({
  imports: [CorsModule.withOpts({ origin: 'https://example.com' })],
  providersPerApp: new ProviderBuilder().useValue(LoggerConfig, { level: 'info' }),
  controllers: [FirstController, SecondController],
})
export class AppModule {}
