import { RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { HelloWorldController } from './hello-world.controller';

@RootModule({
  imports: [RouterModule],
  controllers: [HelloWorldController],
})
export class AppModule {}
