import { Providers, rootModule } from '@ditsmod/core';
import { FirstModule } from './modules/first/first.module.js';

@rootModule({
  appends: [FirstModule],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
