import { Logger, featureModule, Providers } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';
import BunyanLogger from 'bunyan';

import { BunyanController } from './bunyan/bunyan.controller.js';
import { PatchLogger } from './bunyan/patch-logger.js';

@initRest({
  providersPerMod: new Providers()
    .useFactory(Logger, [PatchLogger, PatchLogger.prototype.patchLogger])
    .useToken(BunyanLogger, Logger),
  controllers: [BunyanController],
})
@featureModule()
export class BunyanModule {}
