import { Logger, featureModule, Providers } from '@ditsmod/core';
import BunyanLogger from 'bunyan';
import { RestModule } from '@ditsmod/rest';

import { BunyanController } from './bunyan.controller.js';
import { PatchLogger } from './patch-logger.js';

@featureModule({
  imports: [RestModule],
  controllers: [BunyanController],
  providersPerMod: new Providers()
    .useFactory(Logger, [PatchLogger, PatchLogger.prototype.patchLogger])
    .useToken(BunyanLogger, Logger),
})
export class BunyanModule {}
