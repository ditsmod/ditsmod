import { HttpBackend, Providers, RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';
import { ReturnModule } from '@ditsmod/return';

import { HelloWorldController } from './hello-world.controller';

@RootModule({
  imports: [RouterModule, ReturnModule],
  controllers: [HelloWorldController],
  resolvedCollisionsPerReq: [[HttpBackend, ReturnModule]],
  providersPerApp: [...new Providers().useLogConfig({ level: 'info' })],
  exports: [ReturnModule],
})
export class AppModule {}
