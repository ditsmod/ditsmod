import { Module } from '../../../../../src/decorators';
import { SomeController } from './some.controller';
import { SomeService } from '../../../services/some.service';

@Module({
  providersPerMod: [SomeService],
  providersPerReq: [],
  controllers: [SomeController]
})
export class SomeModule {}
