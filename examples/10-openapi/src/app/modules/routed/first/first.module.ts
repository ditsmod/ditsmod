import { featureModule } from '@ditsmod/core';

import { openapiModuleWithParams } from '#service/openapi/openapi.module.js';
import { FirstController } from './first.controller.js';

@featureModule({
  imports: [openapiModuleWithParams],
  controllers: [FirstController],
})
export class FirstModule {}
