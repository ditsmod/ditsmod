import { RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { FirstModule } from './modules/routed/first/first.module';
import { openapiModuleWithParams } from './modules/services/openapi/openapi.module';

@RootModule({
  // Here works the application and serves OpenAPI documentation.
  listenOptions: { host: 'localhost', port: 3000 },
  imports: [
    RouterModule,
    { path: '', module: FirstModule },
    openapiModuleWithParams,
  ],
  exports: [openapiModuleWithParams],
})
export class AppModule {}
