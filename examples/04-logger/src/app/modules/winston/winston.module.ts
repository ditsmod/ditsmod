import { Logger, featureModule, Providers } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { PatchLogger } from './patch-logger.js';
import { WinstonController } from './winston.controller.js';

@featureModule({
  imports: [RoutingModule],
  controllers: [WinstonController],
  providersPerMod: new Providers()
    .useLogConfig({ level: 'debug' })
    .useFactory(Logger, [PatchLogger, PatchLogger.prototype.patchLogger]),
})
export class WinstonModule {}
