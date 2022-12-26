import { rootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { HelloWorldController } from './hello-world.controller';
import { MyService } from './my.service';
import { OtherService } from './other.service';

@rootModule({
  imports: [RouterModule],
  controllers: [HelloWorldController],
  providersPerReq: [MyService, OtherService]
})
export class AppModule {}
