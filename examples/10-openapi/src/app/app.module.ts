import { Providers, rootModule } from '@ditsmod/core';

import { FirstModule } from '#routed/first/first.module.js';
import { SecondModule } from '#routed/second/second.module.js';

@rootModule({
  appends: [FirstModule, SecondModule],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
