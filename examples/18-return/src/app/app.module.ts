import { Providers, rootModule } from '@ditsmod/core';

import { FirstModule } from './modules/first/first.module.js';
import { SecondModule } from './modules/second/second.module.js';

@rootModule({
  appends: [FirstModule, SecondModule],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
