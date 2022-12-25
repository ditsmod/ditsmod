import { Module } from '@ditsmod/core';

import { FirstModule } from '../first/first.module';
import { SecondMultiProviderService } from './second-multi-provider.service';
import { SecondController } from './second.controler';
import { SecondService } from './second.service';

@Module({
  imports: [FirstModule],
  controllers: [SecondController],
  providersPerReq: [SecondService, { token: 'multi-provider', useClass: SecondMultiProviderService, multi: true }],
  exports: [SecondService, 'multi-provider'],
})
export class SecondModule {}
