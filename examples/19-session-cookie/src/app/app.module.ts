import { Providers, RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';
import { SessionCookieModule } from '@ditsmod/session-cookie';

import { HelloWorldController } from './hello-world.controller';

const sessionModuleWithParams = SessionCookieModule.withParsms({
  cookieName: 'custom-session-name',
  httpOnly: true,
});

@RootModule({
  imports: [RouterModule, sessionModuleWithParams],
  controllers: [HelloWorldController],
  providersPerApp: [...new Providers().useLogConfig({ level: 'info' })],
  exports: [sessionModuleWithParams],
})
export class AppModule {}
