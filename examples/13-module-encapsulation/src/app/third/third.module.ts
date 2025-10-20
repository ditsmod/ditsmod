import { restModule } from '@ditsmod/rest';

import { SecondModule } from '../second/second.module.js';
import { ThirdController } from './third.controler.js';
import { ThirdService } from './three.service.js';

@restModule({
  imports: [SecondModule],
  controllers: [ThirdController],
  providersPerReq: [ThirdService],
  exports: [ThirdService],
})
export class ThirdModule {}
