import { Logger, featureModule, Providers } from '@ditsmod/core';
import { RestModule } from '@ditsmod/rest';

import { PatchLogger } from './patch-logger.js';
import { PinoController } from './pino.controller.js';

@featureModule({
  imports: [RestModule],
  controllers: [PinoController],
  providersPerMod: new Providers().useFactory(Logger, [PatchLogger, PatchLogger.prototype.patchLogger]),
})
export class PinoModule {}
