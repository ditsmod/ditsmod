import { Providers, rootModule } from '@ditsmod/core';

import { SomeModule } from './modules/some/some.module.js';
import { OtherModule } from './modules/other/other.module.js';
import { BearerGuard } from './modules/auth/bearer.guard.js';

@rootModule({
  appends: [SomeModule, { path: 'group-guards', module: OtherModule, guards: [BearerGuard] }],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
