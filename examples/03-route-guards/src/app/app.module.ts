import { Providers, rootModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { Module1 } from './modules/module1.js';

@initRest({ appends: [Module1], providersPerApp: new Providers().useLogConfig({ level: 'info' }) })
@rootModule()
export class AppModule {}
