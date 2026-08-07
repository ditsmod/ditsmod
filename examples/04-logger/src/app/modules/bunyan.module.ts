import { Logger, ProviderBuilder } from '@holu/core';
import { restModule } from '@holu/rest';
import BunyanLogger from 'bunyan';

import { BunyanController } from './bunyan/bunyan.controller.js';
import { PatchLogger } from './bunyan/patch-logger.js';

@restModule({
  providersPerMod: new ProviderBuilder()
    .useFactory(Logger, [PatchLogger, PatchLogger.prototype.patchLogger])
    .useToken(BunyanLogger, Logger),
  controllers: [BunyanController],
})
export class BunyanModule {}
