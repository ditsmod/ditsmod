import { Providers, rootModule } from '@ditsmod/core';
import { initRest, HTTP_INTERCEPTORS } from '@ditsmod/rest';

import { HelloWorldController, HelloWorldController2 } from './hello-world.controller.js';
import { MyHttpInterceptor } from './my-http-interceptor.js';

@initRest({
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
  controllers: [HelloWorldController, HelloWorldController2],
  providersPerRou: [{ token: HTTP_INTERCEPTORS, useClass: MyHttpInterceptor, multi: true }],
  providersPerReq: [{ token: HTTP_INTERCEPTORS, useClass: MyHttpInterceptor, multi: true }],
})
@rootModule()
export class AppModule {}
