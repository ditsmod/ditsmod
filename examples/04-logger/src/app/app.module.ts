import { RootModule, Providers } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { BunyanModule } from './modules/bunyan/bunyan.module';
import { PinoModule } from './modules/pino/pino.module';
import { SomeModule } from './modules/some/some.module';
import { WinstonModule } from './modules/winston/winston.module';

@RootModule({
  imports: [
    RouterModule,
    { path: '', module: SomeModule },
    { path: '', module: WinstonModule },
    { path: '', module: PinoModule },
    { path: '', module: BunyanModule },
  ],
  providersPerApp: [...new Providers().useLogConfig({ level: 'info' })],
})
export class AppModule {}
