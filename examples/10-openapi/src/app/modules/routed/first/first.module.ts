import { featureModule } from '@ditsmod/core';
import { addRest } from '@ditsmod/rest';

import { openapiModuleWithParams } from '#service/openapi/openapi.module.js';
import { FirstController, CtxController } from './first.controller.js';

@addRest({ controllers: [FirstController, CtxController] })
@featureModule({
  imports: [openapiModuleWithParams],
})
export class FirstModule {}
