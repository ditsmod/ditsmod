import { Logger, LoggerConfig, Module, Providers } from '@ditsmod/core';
import BunyanLogger from 'bunyan';

import { BunyanController } from './bunyan.controller';
import { patchLogger } from './patch-logger';

@Module({
  controllers: [BunyanController],
  providersPerMod: [
    ...new Providers()
      .useFactory(Logger, patchLogger, [LoggerConfig])
      .useExisting(BunyanLogger, Logger),
  ],
})
export class BunyanModule {}
