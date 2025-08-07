import { Providers, rootModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { FirstModule } from './modules/first.module.js';

@initRest({ providersPerApp: new Providers().useLogConfig({ level: 'info' }), appends: [FirstModule] })
@rootModule()
export class AppModule {}
