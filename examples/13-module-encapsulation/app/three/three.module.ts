import { Module } from '@ditsmod/core';

import { TwoModule } from '../two/two.module';
import { ThreeService } from './three.service';

@Module({
  imports: [TwoModule],
  providersPerReq: [ThreeService],
  exports: [ThreeService],
})
export class ThreeModule {}
