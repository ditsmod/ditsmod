import { Logger, featureModule, Providers } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { PatchLogger } from './patch-logger.js';
import { PinoController } from './pino.controller.js';

@initRest({ controllers: [PinoController] })
@featureModule({
  providersPerMod: new Providers().useFactory(Logger, [PatchLogger, PatchLogger.prototype.patchLogger]),
})
export class PinoModule {}
