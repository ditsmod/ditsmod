import { LoggerConfig, ProviderBuilder } from '@ditsmod/core';
import { restRootModule } from '@ditsmod/rest';

import { Module1 } from './modules/module1.js';

@restRootModule({
  appends: [Module1],
  providersPerApp: new ProviderBuilder().useValue(LoggerConfig, { level: 'info' }),
})
export class AppModule {}
