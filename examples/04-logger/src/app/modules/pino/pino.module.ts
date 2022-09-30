import { Logger, LoggerConfig, Module, Providers } from '@ditsmod/core';

import { patchLogger } from './patch-logger';
import { PinoController } from './pino.controller';

@Module({
  controllers: [PinoController],
  providersPerMod: [
    ...new Providers()
      .useFactory(Logger, patchLogger, [LoggerConfig])
  ],
})
export class PinoModule {}
