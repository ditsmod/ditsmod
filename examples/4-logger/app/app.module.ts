import { RootModule } from '@ts-stack/ditsmod';

import { BunyanModule } from './modules/bunyan/bunyan.module';
import { PinoModule } from './modules/pino/pino.module';
import { WinstonModule } from './modules/winston/winston.module';
import { ConfigService } from './services-per-app/config.service';

@RootModule({
  imports: [WinstonModule, BunyanModule, PinoModule],
  providersPerApp: [ConfigService],
})
export class AppModule {}
