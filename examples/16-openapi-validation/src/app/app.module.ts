import { Providers, rootModule } from '@ditsmod/core';

import { FirstModule } from './modules/routed/first/first.module.js';
import { openapiModuleWithParams } from './modules/service/openapi/openapi.module.js';
import { initRest } from '@ditsmod/rest';

@initRest({
  importsWithParams: [
    {modRefId: FirstModule, path: ''},
    openapiModuleWithParams.restModuleParams
  ]
})
@rootModule({
  imports: [openapiModuleWithParams.moduleWithParams],
  exports: [openapiModuleWithParams.moduleWithParams],
  providersPerApp: new Providers().useLogConfig({ level: 'info', showExternalLogs: false }),
})
export class AppModule {}
