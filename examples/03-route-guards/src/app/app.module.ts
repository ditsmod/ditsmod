import { Providers, rootModule } from '@ditsmod/core';
import { addRest } from '@ditsmod/rest';

import { Module1 } from './modules/module1/module1.js';

@addRest({ appends: [Module1] })
@rootModule({
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
