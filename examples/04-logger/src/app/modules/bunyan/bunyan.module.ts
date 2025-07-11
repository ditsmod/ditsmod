import { Logger, featureModule, Providers } from '@ditsmod/core';
import { RestModule, addRest } from '@ditsmod/rest';
import BunyanLogger from 'bunyan';

import { BunyanController } from './bunyan.controller.js';
import { PatchLogger } from './patch-logger.js';

@addRest({ controllers: [BunyanController] })
@featureModule({
  imports: [RestModule],
  providersPerMod: new Providers()
    .useFactory(Logger, [PatchLogger, PatchLogger.prototype.patchLogger])
    .useToken(BunyanLogger, Logger),
})
export class BunyanModule {}
