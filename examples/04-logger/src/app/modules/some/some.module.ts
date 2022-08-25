import { LoggerConfig, Module } from '@ditsmod/core';

import { SomeController } from './some.controller';

const loggerConfig = new LoggerConfig('trace');

@Module({
  controllers: [SomeController],
  providersPerMod: [
    { provide: LoggerConfig, useValue: loggerConfig }
  ],
})
export class SomeModule {}
