import { restModule } from '@ditsmod/rest';

import { openapiModuleWithParams } from '#service/openapi/openapi.module.js';
import { FirstController, RouteScopedController } from './first/first.controller.js';

@restModule({
  imports: [{ ...openapiModuleWithParams }],
  controllers: [FirstController, RouteScopedController],
})
export class FirstModule {}
