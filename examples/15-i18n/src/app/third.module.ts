import { featureModule } from '@ditsmod/core';
import { DictService } from '@ditsmod/i18n';
import { initRest } from '@ditsmod/rest';

import { FirstModule } from './first.module.js';
import { MyDictService } from './third/dict.service.js';
import { ThirdController } from './third/third.controller.js';

@initRest({
  imports: [FirstModule],
  controllers: [ThirdController],
  providersPerReq: [{ token: DictService, useClass: MyDictService }],
})
@featureModule()
export class ThirdModule {}
