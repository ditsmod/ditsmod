import { Logger, Module } from '@ditsmod/core';

import { WinstonController } from './winston.controller';
import { WinstonService } from './winston.service';

@Module({
  controllers: [WinstonController],
  providersPerMod: [{ provide: Logger, useClass: WinstonService }],
})
export class WinstonModule {}
