import { Logger, featureModule, Providers } from '@ditsmod/core';
import BunyanLogger = require('bunyan');
import { RouterModule } from '@ditsmod/router';

import { BunyanController } from './bunyan.controller.js';
import { PatchLogger } from './patch-logger.js';

@featureModule({
  imports: [RouterModule],
  controllers: [BunyanController],
  providersPerMod: [
    ...new Providers()
      .useFactory(Logger, [PatchLogger, PatchLogger.prototype.patchLogger])
      .useToken(BunyanLogger, Logger),
  ],
})
export class BunyanModule {}
