import { rootModule } from '@ditsmod/core';

import { Controller1 } from './controllers.js';
import { ServicePerApp, ServicePerMod, ServicePerReq, ServicePerRou } from './services.js';
import { RestModule } from '#init/rest.module.js';
import { addRest } from '#decorators/rest-init-hooks-and-metadata.js';

@addRest({ providersPerRou: [ServicePerRou], providersPerReq: [ServicePerReq], controllers: [Controller1] })
@rootModule({
  imports: [RestModule],
  providersPerApp: [ServicePerApp],
  providersPerMod: [ServicePerMod],
})
export class AppModule {}
