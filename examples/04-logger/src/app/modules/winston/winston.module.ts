import { Logger, featureModule, ProviderBuilder, LoggerConfig } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { PatchLogger } from './patch-logger.js';
import { WinstonController } from './winston.controller.js';

@initRest({ controllers: [WinstonController] })
@featureModule({
  providersPerMod: new ProviderBuilder()
    .useValue(LoggerConfig, { level: 'debug' })
    .useFactory(Logger, [PatchLogger, PatchLogger.prototype.patchLogger]),
})
export class WinstonModule {}
