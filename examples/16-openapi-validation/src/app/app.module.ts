import { Providers, rootModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { FirstModule } from './modules/routed/first/first.module.js';
import { openapiModuleWithParams } from './modules/service/openapi/openapi.module.js';

@rootModule({
  imports: [
    RoutingModule,
    { path: '', module: FirstModule },
    openapiModuleWithParams
  ],
  exports: [openapiModuleWithParams],
  providersPerApp: [...new Providers().useLogConfig({ level: 'info' })]
})
export class AppModule {}
