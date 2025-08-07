import { Providers, rootModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { FirstModule } from '#app/modules/routed/first.module.js';
import { SecondModule } from '#app/modules/routed/second.module.js';

@initRest({
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
  appends: [FirstModule, SecondModule],
})
@rootModule()
export class AppModule {}
