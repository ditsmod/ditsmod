import { Providers } from '@ditsmod/core';
import { restRootModule } from '@ditsmod/rest';

import { FirstModule } from './modules/routed/first/first.module.js';
import { openapiModuleWithParams } from './modules/service/openapi/openapi.module.js';

@restRootModule({
  imports: [FirstModule.withPath(''), openapiModuleWithParams],
  exports: [openapiModuleWithParams],
  providersPerApp: new Providers().useLogConfig({ level: 'info', showExternalLogs: false }),
})
export class AppModule {}
