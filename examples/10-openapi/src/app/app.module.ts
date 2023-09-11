import { Providers, rootModule } from '@ditsmod/core';

import { FirstModule } from './modules/routed/first/first.module.js';
import { SecondModule } from './modules/routed/second/second.module.js';
import { openapiModuleWithParams } from './modules/services/openapi/openapi.module.js';

@rootModule({
  imports: [openapiModuleWithParams],
  appends: [FirstModule, SecondModule],
  exports: [openapiModuleWithParams],
  providersPerApp: [...new Providers().useLogConfig({ level: 'info' })],
})
export class AppModule {}
