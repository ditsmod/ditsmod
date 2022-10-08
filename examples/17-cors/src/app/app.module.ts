import { Providers, RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';
import { CorsModule } from '@ditsmod/cors';

import { FirstController, SecondController } from './controllers';

@RootModule({
  imports: [
    RouterModule,
    CorsModule.withParams({ origin: 'https://example.com' })
  ],
  controllers: [FirstController, SecondController],
  providersPerApp: [
    ...new Providers().useLogConfig({ level: 'info' })
  ]
})
export class AppModule {}
