import { Providers, RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';
import { CorsModule, CorsOptions } from '@ditsmod/cors';

import { FirstController, SecondController } from './controllers';

@RootModule({
  imports: [RouterModule, CorsModule],
  controllers: [FirstController, SecondController],
  providersPerApp: [
    ...new Providers()
      .useLogConfig({ level: 'info' })
      .useValue<CorsOptions>(CorsOptions, { origin: 'https://example.com' }),
  ],
})
export class AppModule {}
