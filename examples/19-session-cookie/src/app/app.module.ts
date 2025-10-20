import { Providers } from '@ditsmod/core';
import { restRootModule } from '@ditsmod/rest';
import { SessionCookieModule } from '@ditsmod/session-cookie';

import { HelloWorldController, HelloWorldController2 } from './hello-world.controller.js';

const sessionModuleWithParams = SessionCookieModule.withParams({
  cookieName: 'custom-session-name',
  httpOnly: true,
});

@restRootModule({
  imports: [sessionModuleWithParams],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
  controllers: [HelloWorldController, HelloWorldController2],
  exports: [sessionModuleWithParams],
})
export class AppModule {}
