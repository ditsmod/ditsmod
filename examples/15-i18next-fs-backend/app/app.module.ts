import { RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';
import { I18nextFsBackendModule, I18nextFsBackendOptions } from '@ditsmod/i18next-fs-backend';

import { HelloWorldController } from './hello-world.controller';

const backend: I18nextFsBackendOptions = {
  loadPath: __dirname + '/locales/current/{{lng}}/{{ns}}.json'
};
@RootModule({
  imports: [RouterModule, I18nextFsBackendModule.withParams({ fallbackLng: 'uk', backend })],
  controllers: [HelloWorldController],
})
export class AppModule {}
