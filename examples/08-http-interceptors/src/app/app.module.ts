import { Providers } from '@ditsmod/core';
import { restRootModule, HTTP_INTERCEPTORS } from '@ditsmod/rest';

import { HelloWorldController, HelloWorldController2 } from './hello-world.controller.js';
import { MyHttpInterceptor } from './my-http-interceptor.js';

@restRootModule({
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
  controllers: [HelloWorldController, HelloWorldController2],
  providersPerRou: [{ token: HTTP_INTERCEPTORS, useClass: MyHttpInterceptor, multi: true }],
  providersPerReq: [{ token: HTTP_INTERCEPTORS, useClass: MyHttpInterceptor, multi: true }],
})
export class AppModule {}
