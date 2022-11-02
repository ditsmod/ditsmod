import { Logger, LoggerConfig, Module, Providers } from '@ditsmod/core';

import { patchLogger } from './patch-logger';
import { WinstonController } from './winston.controller';

@Module({
  controllers: [WinstonController],
  providersPerMod: [
    ...new Providers()
      .useLogConfig({ level: 'debug' })
      .useFactory(Logger, patchLogger, [LoggerConfig])
  ],
})
export class WinstonModule {}
