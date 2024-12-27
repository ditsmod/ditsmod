import { Providers, rootModule } from '@ditsmod/core';

import { Module1 } from './modules/module1/module1.js';
import { AuthModule } from './modules/auth/auth.module.js';

@rootModule({
  imports: [AuthModule],
  appends: [Module1],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
