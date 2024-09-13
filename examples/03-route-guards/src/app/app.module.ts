import { Providers, rootModule } from '@ditsmod/core';

import { SomeModule } from './modules/some/some.module.js';

@rootModule({
  appends: [SomeModule],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
