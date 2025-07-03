import { Logger, featureModule, Providers } from '@ditsmod/core';
import { RestModule } from '@ditsmod/rest';

import { PatchLogger } from './patch-logger.js';
import { WinstonController } from './winston.controller.js';

@featureModule({
  imports: [RestModule],
  controllers: [WinstonController],
  providersPerMod: new Providers()
    .useLogConfig({ level: 'debug' })
    .useFactory(Logger, [PatchLogger, PatchLogger.prototype.patchLogger]),
})
export class WinstonModule {}
