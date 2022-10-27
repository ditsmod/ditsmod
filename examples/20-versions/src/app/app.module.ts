import { Providers, RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';
import { VersionsModule } from '@ditsmod/versions';

import { HelloWorldController } from './hello-world.controller';

@RootModule({
  imports: [RouterModule, VersionsModule],
  controllers: [HelloWorldController],
  providersPerApp: [...new Providers().useLogConfig({ level: 'info' })],
})
export class AppModule {}
