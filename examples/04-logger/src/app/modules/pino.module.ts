import { Logger, ProviderBuilder } from '@holu/core';
import { restModule } from '@holu/rest';

import { PatchLogger } from './pino/patch-logger.js';
import { PinoController } from './pino/pino.controller.js';

@restModule({
  providersPerMod: new ProviderBuilder().useFactory(Logger, [PatchLogger, PatchLogger.prototype.patchLogger]),
  controllers: [PinoController],
})
export class PinoModule {}
