import { featureModule } from '@ditsmod/core';

import { openapiModuleWithParams } from '#service/openapi/openapi.module.js';
import { FirstController, CtxController } from './first.controller.js';

@featureModule({
  imports: [openapiModuleWithParams],
  controllers: [FirstController, CtxController],
})
export class FirstModule {}
