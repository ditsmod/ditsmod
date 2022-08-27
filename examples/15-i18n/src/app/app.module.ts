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
    { path: '', module: ThirdModule },
  ],
  providersPerApp: [
    ...new Providers()
      .useLogConfig({ level: 'debug' }, { tags: ['route', 'i18n'] }),
  ],
})
export class AppModule {}
