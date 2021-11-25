import { Module } from '@ditsmod/core';
import { BodyParserModule } from '@ditsmod/body-parser';

import { OnePerRouService } from './one-per-rou.service';
import { OneService } from './one.service';

@Module({
  imports: [BodyParserModule],
  providersPerRou: [OnePerRouService],
  providersPerReq: [OneService],
  exports: [OneService, OnePerRouService, BodyParserModule],
})
export class OneModule {}
