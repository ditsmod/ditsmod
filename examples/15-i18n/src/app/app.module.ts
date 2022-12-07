import { Providers, RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { SecondModule } from './second/second.module';
import { FirstModule } from './first/first.module';
import { ThirdModule } from './third/third.module';

@RootModule({
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
