import { Providers, rootModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';
import { SessionCookieModule } from '@ditsmod/session-cookie';

import { HelloWorldController } from './hello-world.controller.js';

const sessionModuleWithParams = SessionCookieModule.withParams({
  cookieName: 'custom-session-name',
  httpOnly: true,
});

@rootModule({
  imports: [RoutingModule, sessionModuleWithParams],
  controllers: [HelloWorldController],
  providersPerApp: [...new Providers().useLogConfig({ level: 'info' })],
  exports: [sessionModuleWithParams],
})
export class AppModule {}
