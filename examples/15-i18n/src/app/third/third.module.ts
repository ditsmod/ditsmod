import { featureModule } from '@ditsmod/core';
import { DictService } from '@ditsmod/i18n';
import { RouterModule } from '@ditsmod/router';

import { FirstModule } from '../first/first.module.js';
import { MyDictService } from './dict.service.js';
import { ThirdController } from './third.controller.js';

@featureModule({
  imports: [RouterModule, FirstModule],
  controllers: [ThirdController],
  providersPerReq: [{ token: DictService, useClass: MyDictService }],
})
export class ThirdModule {}
