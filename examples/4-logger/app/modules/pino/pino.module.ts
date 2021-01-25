import { Logger, Module } from '@ts-stack/ditsmod';

import { PinoController } from './pino.controller';
import { PinoService } from './pino.service';

@Module({
  controllers: [PinoController],
  providersPerMod: [{ provide: Logger, useClass: PinoService }],
})
export class PinoModule {}
