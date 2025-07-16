import { Providers, rootModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { FirstModule } from '#routed/first/first.module.js';
import { SecondModule } from '#routed/second/second.module.js';

@initRest({ appends: [FirstModule, SecondModule] })
@rootModule({
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
