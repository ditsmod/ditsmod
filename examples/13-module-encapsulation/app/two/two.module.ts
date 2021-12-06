import { Module } from '@ditsmod/core';

import { OneModule } from '../one/one.module';
import { MultiProvider2Service } from './multi-provider-2.service';
import { SecondController } from './second.controler';
import { TwoService } from './two.service';

@Module({
  imports: [OneModule],
  controllers: [SecondController],
  providersPerReq: [TwoService, { provide: 'multi-provider', useClass: MultiProvider2Service, multi: true }],
  exports: [TwoService, 'multi-provider'],
})
export class TwoModule {}
