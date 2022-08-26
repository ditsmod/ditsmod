import { Module, Providers } from '@ditsmod/core';

import { SomeModule } from '../some/some.module';
import { SomeLogMediator } from '../some/some-log-mediator';
import { OtherController } from './other.controller';
import { OtherLogMediator } from './other-log-mediator';

@Module({
  imports: [SomeModule],
  controllers: [OtherController],
  providersPerMod: [
    ...new Providers()
      .useClass(SomeLogMediator, OtherLogMediator)
  ],
})
export class OtherModule {}
