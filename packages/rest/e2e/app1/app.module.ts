import { rootModule } from '@ditsmod/core';

import { Controller1 } from './controllers.js';
import { ServicePerApp, ServicePerMod, ServicePerReq, ServicePerRou } from './services.js';
import { RestModule } from '#module/rest.module.js';

@rootModule({
  imports: [RestModule],
  controllers: [Controller1],
  providersPerApp: [ServicePerApp],
  providersPerMod: [ServicePerMod],
  providersPerRou: [ServicePerRou],
  providersPerReq: [ServicePerReq],
})
export class AppModule {}
