import { Logger, featureModule, Providers } from '@ditsmod/core';

import { PatchLogger } from './patch-logger';
import { PinoController } from './pino.controller';

@featureModule({
  controllers: [PinoController],
  providersPerMod: [
    ...new Providers()
    .useFactory(Logger, [PatchLogger, PatchLogger.prototype.patchLogger])
  ],
})
export class PinoModule {}
