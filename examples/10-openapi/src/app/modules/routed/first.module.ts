import { featureModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { openapiModuleWithParams } from '#service/openapi/openapi.module.js';
import { FirstController, CtxController } from './first/first.controller.js';

@initRest({
  imports: [openapiModuleWithParams],
  controllers: [FirstController, CtxController],
})
@featureModule()
export class FirstModule {}
