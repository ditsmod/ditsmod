import { Module } from '@ditsmod/core';

import { SomeLogMediator } from './some-log-mediator';
import { SomeService } from './some.service';

@Module({
  providersPerMod: [SomeLogMediator, SomeService],
  exports: [SomeService]
})
export class SomeModule {}
