import { LoggerConfig, ProviderBuilder } from '@holu/core';
import { restRootModule } from '@holu/rest';
import { SessionCookieModule } from '@holu/session-cookie';

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
