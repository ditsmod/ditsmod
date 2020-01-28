import { Module } from '../../../../../src/decorators';
import { SomeService } from '../../../services/some.service';

@Module({
  exports: [SomeService],
  providersPerMod: [],
  providersPerReq: [SomeService]
})
export class OtherModule {}
