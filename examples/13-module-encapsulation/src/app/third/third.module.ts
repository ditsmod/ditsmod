import { featureModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { SecondModule } from '../second/second.module.js';
import { ThirdController } from './third.controler.js';
import { ThirdService } from './three.service.js';

@initRest({ controllers: [ThirdController], providersPerReq: [ThirdService], exports: [ThirdService] })
@featureModule({
  imports: [SecondModule],
})
export class ThirdModule {}
