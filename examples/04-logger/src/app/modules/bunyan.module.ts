import { Logger, Providers } from '@ditsmod/core';
import { restModule } from '@ditsmod/rest';
import BunyanLogger from 'bunyan';

import { BunyanController } from './bunyan/bunyan.controller.js';
import { PatchLogger } from './bunyan/patch-logger.js';

@restModule({
  providersPerMod: new Providers()
    .useFactory(Logger, [PatchLogger, PatchLogger.prototype.patchLogger])
    .useToken(BunyanLogger, Logger),
  controllers: [BunyanController],
})
export class BunyanModule {}
