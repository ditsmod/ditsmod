import { Module } from '@ditsmod/core';

import { OneModule } from '../one/one.module';
import { TwoModule } from '../two/two.module';
import { ThreeService } from './three.service';

@Module({
  imports: [TwoModule, OneModule],
  providersPerReq: [ThreeService],
  exports: [ThreeService],
})
export class ThreeModule {}
