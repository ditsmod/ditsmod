import { rootModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { FirstModule } from './modules/first.module.js';

@initRest({ appends: [FirstModule] })
@rootModule()
export class AppModule {}
