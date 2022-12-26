import { rootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { FirstModule } from './modules/routed/first/first.module';
import { SecondModule } from './modules/routed/second/second.module';
import { openapiModuleWithParams } from './modules/services/openapi/openapi.module';

@rootModule({
  // Here works the application and serves OpenAPI documentation.
  listenOptions: { host: 'localhost', port: 3000 },
  imports: [RouterModule, openapiModuleWithParams],
  appends: [FirstModule, SecondModule],
  exports: [openapiModuleWithParams],
})
export class AppModule {}
