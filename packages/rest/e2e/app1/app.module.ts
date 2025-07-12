import { rootModule } from '@ditsmod/core';

import { Controller1 } from './controllers.js';
import { ServicePerApp, ServicePerMod, ServicePerReq, ServicePerRou } from './services.js';
import { RestModule } from '#module/rest.module.js';
import { addRest } from '#decorators/rest-metadata.js';

@addRest({ providersPerRou: [ServicePerRou], providersPerReq: [ServicePerReq], controllers: [Controller1] })
@rootModule({
  imports: [RestModule],
  providersPerApp: [ServicePerApp],
  providersPerMod: [ServicePerMod],
})
export class AppModule {}
