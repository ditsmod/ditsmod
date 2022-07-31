import { Logger, LoggerConfig, Module } from '@ditsmod/core';
import pino from 'pino';

import { PinoController } from './pino.controller';

const pinoLogger = pino();

@Module({
  controllers: [PinoController],
  providersPerMod: [
    { provide: Logger, useValue: pinoLogger },
  ],
})
export class PinoModule {
  constructor(config: LoggerConfig){
    pinoLogger.level = config.level;
  }
}
