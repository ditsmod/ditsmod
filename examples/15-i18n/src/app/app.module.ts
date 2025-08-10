import { rootModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { SecondModule } from './second.module.js';
import { FirstModule } from './first.module.js';
import { ThirdModule } from './third.module.js';

@initRest({
  appends: [ThirdModule],
  imports: [
    { path: '', module: FirstModule },
    { path: '', module: SecondModule },
  ],
})
@rootModule()
export class AppModule {}
