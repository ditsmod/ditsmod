import { Providers, rootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { SecondModule } from './second/second.module.js';
import { FirstModule } from './first/first.module.js';
import { ThirdModule } from './third/third.module.js';

@rootModule({
  imports: [
    RouterModule,
    { path: '', module: FirstModule },
    { path: '', module: SecondModule },
  ],
  appends: [ThirdModule],
  providersPerApp: [
    ...new Providers()
      .useLogConfig({ level: 'info' }),
  ],
})
export class AppModule {}
