import { LoggerConfig, Module } from '@ditsmod/core';

import { SecondController } from './second.controller';

const loggerConfig = new LoggerConfig('debug');

@Module({
  controllers: [SecondController],
  providersPerMod: [{ provide: LoggerConfig, useValue: loggerConfig }],
})
export class SecondModule {}
