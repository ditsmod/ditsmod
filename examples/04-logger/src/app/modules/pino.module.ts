import { Logger, Providers } from '@ditsmod/core';
import { restModule } from '@ditsmod/rest';

import { PatchLogger } from './pino/patch-logger.js';
import { PinoController } from './pino/pino.controller.js';

@restModule({
  providersPerMod: new Providers().useFactory(Logger, [PatchLogger, PatchLogger.prototype.patchLogger]),
  controllers: [PinoController],
})
export class PinoModule {}
