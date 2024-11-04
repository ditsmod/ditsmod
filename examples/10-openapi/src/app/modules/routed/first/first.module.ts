import { featureModule } from '@ditsmod/core';

import { openapiModuleWithParams } from '#service/openapi/openapi.module.js';
import { FirstController, SingletonController } from './first.controller.js';

@featureModule({
  imports: [openapiModuleWithParams],
  controllers: [FirstController, SingletonController],
})
export class FirstModule {}
