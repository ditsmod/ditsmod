import { Providers, rootModule } from '@ditsmod/core';

import { FirstModule } from './modules/routed/first/first.module.js';
import { openapiModuleWithParams } from './modules/service/openapi/openapi.module.js';

@rootModule({
  imports: [
    { path: '', module: FirstModule },
    openapiModuleWithParams,
  ],
  exports: [openapiModuleWithParams],
  providersPerApp: [...new Providers().useLogConfig({ level: 'info', showExternalLogs: false })]
})
export class AppModule {}
