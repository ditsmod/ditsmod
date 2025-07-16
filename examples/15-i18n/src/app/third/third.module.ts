import { featureModule } from '@ditsmod/core';
import { DictService } from '@ditsmod/i18n';
import { initRest, RestModule } from '@ditsmod/rest';

import { FirstModule } from '../first/first.module.js';
import { MyDictService } from './dict.service.js';
import { ThirdController } from './third.controller.js';

@initRest({ controllers: [ThirdController], providersPerReq: [{ token: DictService, useClass: MyDictService }] })
@featureModule({
  imports: [RestModule, FirstModule],
})
export class ThirdModule {}
