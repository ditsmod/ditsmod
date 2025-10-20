import { Providers } from '@ditsmod/core';
import { restRootModule } from '@ditsmod/rest';
import { CorsModule } from '@ditsmod/cors';

import { FirstController, SecondController } from './controllers.js';

@restRootModule({
  imports: [CorsModule.withParams({ origin: 'https://example.com' })],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
  controllers: [FirstController, SecondController],
})
export class AppModule {}
