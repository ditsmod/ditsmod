import { Providers, rootModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { SecondModule } from './second/second.module.js';
import { FirstModule } from './first/first.module.js';
import { ThirdModule } from './third/third.module.js';

@initRest({
  appends: [ThirdModule],
})
@rootModule({
  imports: [FirstModule.withPath(''), SecondModule.withPath('')],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
