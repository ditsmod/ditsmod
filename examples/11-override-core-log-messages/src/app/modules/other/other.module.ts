import { Module } from '@ditsmod/core';

import { SomeModule } from '../some/some.module';
import { SomeLogMediator } from '../some/some-log-mediator';
import { OtherController } from './other.controller';
import { OtherLogMediator } from './other-log-mediator';

@Module({
  imports: [SomeModule],
  controllers: [OtherController],
  providersPerMod: [{ provide: SomeLogMediator, useClass: OtherLogMediator }],
})
export class OtherModule {}
