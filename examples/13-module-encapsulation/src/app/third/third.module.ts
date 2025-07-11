import { featureModule } from '@ditsmod/core';
import { addRest, RestModule } from '@ditsmod/rest';

import { SecondModule } from '../second/second.module.js';
import { ThirdController } from './third.controler.js';
import { ThirdService } from './three.service.js';

@addRest({ controllers: [ThirdController], providersPerReq: [ThirdService], exports: [ThirdService] })
@featureModule({
  imports: [RestModule, SecondModule],
})
export class ThirdModule {}
