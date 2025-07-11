import { rootModule, Providers } from '@ditsmod/core';
import { addRest } from '@ditsmod/rest';

import { BunyanModule } from './modules/bunyan/bunyan.module.js';
import { PinoModule } from './modules/pino/pino.module.js';
import { SomeModule } from './modules/some/some.module.js';
import { WinstonModule } from './modules/winston/winston.module.js';

@addRest({ appends: [SomeModule, WinstonModule, PinoModule, BunyanModule] })
@rootModule({
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
