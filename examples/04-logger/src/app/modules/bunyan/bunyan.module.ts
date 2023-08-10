import { Logger, featureModule, Providers } from '@ditsmod/core';
import BunyanLogger = require('bunyan');

import { BunyanController } from './bunyan.controller';
import { PatchLogger } from './patch-logger';

@featureModule({
  controllers: [BunyanController],
  providersPerMod: [
    ...new Providers()
      .useFactory(Logger, [PatchLogger, PatchLogger.prototype.patchLogger])
      .useToken(BunyanLogger, Logger),
  ],
})
export class BunyanModule {}
