import { RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';
import { I18nModule } from '@ditsmod/i18n';

import { HelloWorldController } from './hello-world.controller';

@RootModule({
  imports: [RouterModule, I18nModule.withParams()],
  controllers: [HelloWorldController],
})
export class AppModule {}
