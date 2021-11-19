import { Module } from '@ditsmod/core';

import { OnePerRouService } from './one-per-rou.service';
import { OneService } from './one.service';

@Module({
  providersPerRou: [],
  providersPerReq: [OneService, OnePerRouService],
  exports: [OneService, OnePerRouService],
})
export class OneModule {}
