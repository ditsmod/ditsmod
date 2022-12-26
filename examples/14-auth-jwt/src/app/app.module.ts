import { rootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { HelloWorldController } from './hello-world.controller';
import { AuthModule } from './modules/services/auth/auth.module';

@rootModule({
  imports: [RouterModule, { path: '', module: AuthModule }],
  controllers: [HelloWorldController],
})
export class AppModule {}
