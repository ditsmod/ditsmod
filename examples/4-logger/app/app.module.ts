import { RootModule, LoggerConfig, Logger } from '@ts-stack/ditsmod';

import { BunyanModule } from './modules/bunyan/bunyan.module';
import { PinoModule } from './modules/pino/pino.module';
import { SomeModule } from './modules/some/some.module';
import { WinstonService } from './providers-per-app/winston.service';

const loggerConfig = new LoggerConfig();
loggerConfig.level = 'trace';

@RootModule({
  imports: [BunyanModule, PinoModule, SomeModule],
  providersPerApp: [
    { provide: Logger, useClass: WinstonService },
    { provide: LoggerConfig, useValue: loggerConfig },
  ],
})
export class AppModule {}
