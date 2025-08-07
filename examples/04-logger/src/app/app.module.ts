import { rootModule, Providers } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { BunyanModule } from './modules/bunyan.module.js';
import { PinoModule } from './modules/pino.module.js';
import { SomeModule } from './modules/some.module.js';
import { WinstonModule } from './modules/winston/winston.module.js';

@initRest({
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
  appends: [SomeModule, WinstonModule, PinoModule, BunyanModule],
})
@rootModule()
export class AppModule {}
