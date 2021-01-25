import { RootModule } from '@ts-stack/ditsmod';

import { BunyanModule } from './modules/bunyan/bunyan.module';
import { PinoModule } from './modules/pino/pino.module';
import { ConfigService } from './services-per-app/config.service';

@RootModule({
  imports: [BunyanModule, PinoModule],
  providersPerApp: [ConfigService],
})
export class AppModule {}
