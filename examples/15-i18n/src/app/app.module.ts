import { Providers, rootModule } from '@ditsmod/core';
import { initRest, RestModule } from '@ditsmod/rest';

import { SecondModule } from './second/second.module.js';
import { FirstModule } from './first/first.module.js';
import { ThirdModule } from './third/third.module.js';

@initRest({
  importsWithParams: [
    { modRefId: FirstModule, path: '' },
    { modRefId: SecondModule, path: '' },
  ],
  appends: [ThirdModule],
})
@rootModule({
  imports: [RestModule],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
