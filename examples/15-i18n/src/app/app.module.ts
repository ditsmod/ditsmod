import { Providers, rootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { SecondModule } from './second/second.module';
import { FirstModule } from './first/first.module';
import { ThirdModule } from './third/third.module';

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
