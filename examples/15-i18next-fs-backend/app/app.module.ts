import { RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';
import { I18nextFsBackendModule } from '@ditsmod/i18next-fs-backend';

import { HelloWorldController } from './hello-world.controller';

@RootModule({
  imports: [RouterModule, I18nextFsBackendModule.withParams({ fallbackLng: 'uk' })],
  controllers: [HelloWorldController],
})
export class AppModule {}
