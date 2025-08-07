import { featureModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { SecondModule } from '../second/second.module.js';
import { ThirdController } from './third.controler.js';
import { ThirdService } from './three.service.js';

@initRest({
  imports: [SecondModule],
  controllers: [ThirdController],
  providersPerReq: [ThirdService],
  exports: [ThirdService],
})
@featureModule()
export class ThirdModule {}
