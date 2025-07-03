import { featureModule } from '@ditsmod/core';
import { DictService } from '@ditsmod/i18n';
import { RestModule } from '@ditsmod/rest';

import { FirstModule } from '../first/first.module.js';
import { MyDictService } from './dict.service.js';
import { ThirdController } from './third.controller.js';

@featureModule({
  imports: [RestModule, FirstModule],
  controllers: [ThirdController],
  providersPerReq: [{ token: DictService, useClass: MyDictService }],
})
export class ThirdModule {}
