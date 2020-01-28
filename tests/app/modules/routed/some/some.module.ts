import { Module } from '../../../../../src/decorators';
import { SomeController } from './some.controller';
import { SomeService } from '../../../services/some.service';
import { OtherModule } from './other.module';

@Module({
  imports: [OtherModule],
  exports: [SomeService],
  providersPerMod: [],
  providersPerReq: [],
  controllers: [SomeController]
})
export class SomeModule {}
