import { Logger, featureModule, Providers } from '@ditsmod/core';
import { RestModule, initRest } from '@ditsmod/rest';

import { PatchLogger } from './patch-logger.js';
import { WinstonController } from './winston.controller.js';

@initRest({ controllers: [WinstonController] })
@featureModule({
  imports: [RestModule],
  providersPerMod: new Providers()
    .useLogConfig({ level: 'debug' })
    .useFactory(Logger, [PatchLogger, PatchLogger.prototype.patchLogger]),
})
export class WinstonModule {}
