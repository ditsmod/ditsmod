import { Logger, Module } from '@ts-stack/ditsmod';

import { BunyanConfigService } from './bunyan-config.service';
import { BunyanController } from './bunyan.controller';
import { BunyanService } from './bunyan.service';

@Module({
  controllers: [BunyanController],
  providersPerMod: [BunyanConfigService, { provide: Logger, useClass: BunyanService }],
})
export class BunyanModule {}
