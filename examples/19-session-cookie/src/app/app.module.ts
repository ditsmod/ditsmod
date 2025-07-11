import { Providers, rootModule } from '@ditsmod/core';
import { addRest, RestModule } from '@ditsmod/rest';
import { SessionCookieModule } from '@ditsmod/session-cookie';

import { HelloWorldController, HelloWorldController2 } from './hello-world.controller.js';

const sessionModuleWithParams = SessionCookieModule.withParams({
  cookieName: 'custom-session-name',
  httpOnly: true,
});

@addRest({controllers: [HelloWorldController, HelloWorldController2],})
@rootModule({
  imports: [RestModule, sessionModuleWithParams],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
  exports: [sessionModuleWithParams],
})
export class AppModule {}
