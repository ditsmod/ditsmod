import { Logger, featureModule, Providers } from '@ditsmod/core';

import { PatchLogger } from './patch-logger';
import { WinstonController } from './winston.controller';

@featureModule({
  controllers: [WinstonController],
  providersPerMod: [
    ...new Providers()
      .useLogConfig({ level: 'debug' })
      .useFactory(Logger, [PatchLogger, PatchLogger.prototype.patchLogger])
  ],
})
export class WinstonModule {}
