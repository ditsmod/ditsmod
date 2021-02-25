import { RootModule, LoggerConfig, Router, Logger } from '@ts-stack/ditsmod';
import { DefaultRouter } from '@ts-stack/router';

import { BunyanModule } from './modules/bunyan/bunyan.module';
import { PinoModule } from './modules/pino/pino.module';
import { SomeModule } from './modules/some/some.module';
import { WinstonModule } from './modules/winston/winston.module';

const loggerConfig = new LoggerConfig();
const level: keyof Logger = 'debug';
loggerConfig.level = level;
loggerConfig.depth = 3;

@RootModule({
  imports: [BunyanModule, PinoModule, WinstonModule, SomeModule],
  providersPerApp: [
    { provide: LoggerConfig, useValue: loggerConfig },
    { provide: Router, useClass: DefaultRouter },
  ],
})
export class AppModule {}
