import { Providers, rootModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { SecondModule } from './second.module.js';
import { FirstModule } from './first.module.js';
import { ThirdModule } from './third.module.js';

@initRest({
  appends: [ThirdModule],
  imports: [FirstModule.withPath(''), SecondModule.withPath('')],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
@rootModule()
export class AppModule {}
