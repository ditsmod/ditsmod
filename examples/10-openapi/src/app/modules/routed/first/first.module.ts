import { featureModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { openapiModuleWithParams } from '#service/openapi/openapi.module.js';
import { FirstController, CtxController } from './first.controller.js';

@initRest({
  controllers: [FirstController, CtxController],
  importsWithParams: [openapiModuleWithParams.restModuleParams],
})
@featureModule({
  imports: [openapiModuleWithParams.moduleWithParams],
})
export class FirstModule {}
