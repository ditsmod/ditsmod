import { Providers, rootModule } from '@ditsmod/core';
import { addRest } from '@ditsmod/rest';

import { FirstModule } from './modules/first/first.module.js';

@addRest({ appends: [FirstModule] })
@rootModule({
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
