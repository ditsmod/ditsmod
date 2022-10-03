import { Providers, RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';
import { CorsModule, CorsOptions } from '@ditsmod/cors';

import { HelloWorldController } from './hello-world.controller';

@RootModule({
  imports: [RouterModule, CorsModule],
  controllers: [HelloWorldController],
  providersPerApp: [
    ...new Providers()
      .useLogConfig({ level: 'info' })
      .useValue<CorsOptions>(CorsOptions, { origin: 'https://example.com' }),
  ],
})
export class AppModule {}
