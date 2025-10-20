import { restModule } from '@ditsmod/rest';

import { openapiModuleWithParams } from '#service/openapi/openapi.module.js';
import { FirstController, CtxController } from './first/first.controller.js';

@restModule({
  imports: [{ ...openapiModuleWithParams }],
  controllers: [FirstController, CtxController],
})
export class FirstModule {}
