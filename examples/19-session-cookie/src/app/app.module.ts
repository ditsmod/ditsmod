import { LoggerConfig, ProviderBuilder } from '@ditsmod/core';
import { restRootModule } from '@ditsmod/rest';
import { SessionCookieModule } from '@ditsmod/session-cookie';

import { HelloWorldController, HelloWorldController2 } from './hello-world.controller.js';

const sessionDynamicModule = SessionCookieModule.withOpts({
  cookieName: 'custom-session-name',
  httpOnly: true,
});

@restRootModule({
  imports: [sessionDynamicModule],
  providersPerApp: new ProviderBuilder().useValue(LoggerConfig, { level: 'info' }),
  controllers: [HelloWorldController, HelloWorldController2],
  exports: [sessionDynamicModule],
})
export class AppModule {}
