import { RootModule, LoggerConfig, Logger, Router } from '@ts-stack/ditsmod';
import { DefaultRouter } from '@ts-stack/router';

import { PinoModule } from './modules/pino/pino.module';
import { SomeModule } from './modules/some/some.module';
import { WinstonModule } from './modules/winston/winston.module';
import { BunyanService } from './providers-per-app/bunyan.service';

const loggerConfig = new LoggerConfig();
loggerConfig.level = 'trace';

@RootModule({
  imports: [PinoModule, WinstonModule, SomeModule],
  providersPerApp: [
    { provide: Logger, useClass: BunyanService },
    { provide: LoggerConfig, useValue: loggerConfig },
    { provide: Router, useClass: DefaultRouter }
  ],
})
export class AppModule {}
