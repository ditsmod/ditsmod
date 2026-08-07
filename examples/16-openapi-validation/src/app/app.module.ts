import { LoggerConfig, ProviderBuilder } from '@holu/core';
import { restRootModule } from '@holu/rest';

import { FirstModule } from './modules/routed/first/first.module.js';
import { openapiDynamicModule } from './modules/service/openapi/openapi.module.js';

@restRootModule({
  imports: [FirstModule.withPath(''), openapiDynamicModule],
  exports: [openapiDynamicModule],
  providersPerApp: new ProviderBuilder().useValue(LoggerConfig, { level: 'info', showExternalLogs: false }),
})
export class AppModule {}
