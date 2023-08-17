import { rootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { HelloWorldController } from './hello-world.controller';
import { MyService } from './my.service';
import { OtherService } from './other.service';
import { Controller1 } from './bad.controllers';

@rootModule({
  imports: [RouterModule],
  controllers: [HelloWorldController, Controller1],
  providersPerReq: [MyService, OtherService]
})
export class AppModule {}
