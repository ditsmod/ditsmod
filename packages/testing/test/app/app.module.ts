import { rootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { Controller1 } from './controllers.js';
import { ServicePerApp, ServicePerMod, ServicePerReq, ServicePerRou } from './services.js';

@rootModule({
  imports: [RouterModule],
  controllers: [Controller1],
  providersPerApp: [ServicePerApp],
  providersPerMod: [ServicePerMod],
  providersPerRou: [ServicePerRou],
  providersPerReq: [ServicePerReq],
})
export class AppModule {}
