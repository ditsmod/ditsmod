import { Logger, Module } from '@ditsmod/core';

import { BunyanController } from './bunyan.controller';
import { BunyanService } from './bunyan.service';

@Module({
  controllers: [BunyanController],
  providersPerMod: [{ provide: Logger, useClass: BunyanService }],
})
export class BunyanModule {}
