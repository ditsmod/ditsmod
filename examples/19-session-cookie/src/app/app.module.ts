import { Providers, rootModule } from '@ditsmod/core';
import { RestModule } from '@ditsmod/rest';
import { SessionCookieModule } from '@ditsmod/session-cookie';

import { HelloWorldController, HelloWorldController2 } from './hello-world.controller.js';

const sessionModuleWithParams = SessionCookieModule.withParams({
  cookieName: 'custom-session-name',
  httpOnly: true,
});

@rootModule({
  imports: [RestModule, sessionModuleWithParams],
  controllers: [HelloWorldController, HelloWorldController2],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
  exports: [sessionModuleWithParams],
})
export class AppModule {}
