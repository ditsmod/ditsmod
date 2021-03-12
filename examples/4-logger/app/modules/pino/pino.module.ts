import { Logger, Module } from '@ditsmod/core';

import { PinoController } from './pino.controller';
import { PinoService } from './pino.service';

@Module({
  controllers: [PinoController],
  providersPerMod: [{ provide: Logger, useClass: PinoService }],
})
export class PinoModule {}
