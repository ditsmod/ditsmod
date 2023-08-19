import { rootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { FirstModule } from './modules/routed/first/first.module';
import { openapiModuleWithParams } from './modules/service/openapi/openapi.module';

@rootModule({
  imports: [
    RouterModule,
    { path: '', module: FirstModule },
    openapiModuleWithParams
  ],
  exports: [openapiModuleWithParams],
})
export class AppModule {}
