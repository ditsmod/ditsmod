import { Providers, rootModule } from '@ditsmod/core';
import { Module1 } from './modules/module1/module1.js';

@rootModule({
  appends: [Module1],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
