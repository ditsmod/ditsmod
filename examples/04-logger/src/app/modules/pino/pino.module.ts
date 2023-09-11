import { Logger, featureModule, Providers } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { PatchLogger } from './patch-logger.js';
import { PinoController } from './pino.controller.js';

@featureModule({
  imports: [RouterModule],
  controllers: [PinoController],
  providersPerMod: [
    ...new Providers()
    .useFactory(Logger, [PatchLogger, PatchLogger.prototype.patchLogger])
  ],
})
export class PinoModule {}
