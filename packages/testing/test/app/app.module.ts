import { rootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { Controller1 } from './controllers';
import { ServicePerApp, ServicePerMod, ServicePerReq, ServicePerRou } from './services';

@rootModule({
  imports: [RouterModule],
  controllers: [Controller1],
  providersPerApp: [ServicePerApp],
  providersPerMod: [ServicePerMod],
  providersPerRou: [ServicePerRou],
  providersPerReq: [ServicePerReq],
})
export class AppModule {}
