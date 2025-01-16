import { rootModule } from '@ditsmod/core';

import { Controller1 } from './controllers.js';
import { ServicePerApp, ServicePerMod, ServicePerReq, ServicePerRou } from './services.js';
import { RoutingModule } from '#module/routing.module.js';

@rootModule({
  imports: [RoutingModule],
  controllers: [Controller1],
  providersPerApp: [ServicePerApp],
  providersPerMod: [ServicePerMod],
  providersPerRou: [ServicePerRou],
  providersPerReq: [ServicePerReq],
})
export class AppModule {}
