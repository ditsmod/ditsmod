import { Logger, Module } from '@ts-stack/ditsmod';

import { PinoConfigService } from './pino-config.service';
import { PinoController } from './pino.controller';
import { PinoService } from './pino.service';

@Module({
  controllers: [PinoController],
  providersPerMod: [PinoConfigService, { provide: Logger, useClass: PinoService }],
})
export class PinoModule {}
