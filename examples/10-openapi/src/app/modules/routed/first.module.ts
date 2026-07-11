import { restModule } from '@ditsmod/rest';

import { openapiDynamicModule } from '#service/openapi/openapi.module.js';
import { FirstController, RouteScopedController } from './first/first.controller.js';

@restModule({
  imports: [{ ...openapiDynamicModule }],
  controllers: [FirstController, RouteScopedController],
})
export class FirstModule {}
