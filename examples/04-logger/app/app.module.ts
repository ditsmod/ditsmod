import { RootModule, LoggerConfig, Logger } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { BunyanModule } from './modules/bunyan/bunyan.module';
import { PinoModule } from './modules/pino/pino.module';
import { SomeModule } from './modules/some/some.module';
import { WinstonModule } from './modules/winston/winston.module';

const loggerConfig = new LoggerConfig();
const level: keyof Logger = 'debug';
loggerConfig.level = level;

@RootModule({
  imports: [RouterModule, BunyanModule, PinoModule, WinstonModule, SomeModule],
  providersPerApp: [
    { provide: LoggerConfig, useValue: loggerConfig }
  ]
})
export class AppModule {}
