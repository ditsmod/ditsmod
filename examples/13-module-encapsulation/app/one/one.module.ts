import { Module } from '@ditsmod/core';
import { BodyParserModule } from '@ditsmod/body-parser';

import { OnePerRouService } from './one-per-rou.service';
import { OneService } from './one.service';
import { MultiProvider1Service } from './multi-provider-1.service';
import { FirstController } from './first.controler';

@Module({
  imports: [BodyParserModule],
  controllers: [FirstController],
  providersPerRou: [OnePerRouService],
  providersPerReq: [OneService, { provide: 'multi-provider', useClass: MultiProvider1Service, multi: true }],
  exports: [OneService, OnePerRouService, BodyParserModule, 'multi-provider'],
})
export class OneModule {}
