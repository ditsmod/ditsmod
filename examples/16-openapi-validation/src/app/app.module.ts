import { rootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { FirstModule } from './modules/routed/first/first.module.js';
import { openapiModuleWithParams } from './modules/service/openapi/openapi.module.js';

@rootModule({
  imports: [
    RouterModule,
    { path: '', module: FirstModule },
    openapiModuleWithParams
  ],
  exports: [openapiModuleWithParams],
})
export class AppModule {}
