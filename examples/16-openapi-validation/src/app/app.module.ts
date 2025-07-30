import { Providers, rootModule } from '@ditsmod/core';

import { FirstModule } from './modules/routed/first/first.module.js';
import { openapiModuleWithParams } from './modules/service/openapi/openapi.module.js';
import { initRest } from '@ditsmod/rest';

@initRest()
@rootModule({
  imports: [FirstModule.withPath(''), openapiModuleWithParams],
  exports: [openapiModuleWithParams],
  providersPerApp: new Providers().useLogConfig({ level: 'info', showExternalLogs: false }),
})
export class AppModule {}
