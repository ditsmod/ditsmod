import { Logger, featureModule, Providers } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { PatchLogger } from './pino/patch-logger.js';
import { PinoController } from './pino/pino.controller.js';

@initRest({
  providersPerMod: new Providers().useFactory(Logger, [PatchLogger, PatchLogger.prototype.patchLogger]),
  controllers: [PinoController],
})
@featureModule()
export class PinoModule {}
