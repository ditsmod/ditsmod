import { Providers, rootModule } from '@ditsmod/core';
import { addRest, HTTP_INTERCEPTORS, RestModule } from '@ditsmod/rest';

import { HelloWorldController, HelloWorldController2 } from './hello-world.controller.js';
import { MyHttpInterceptor } from './my-http-interceptor.js';

@addRest({
  controllers: [HelloWorldController, HelloWorldController2],
  providersPerRou: [{ token: HTTP_INTERCEPTORS, useClass: MyHttpInterceptor, multi: true }],
  providersPerReq: [{ token: HTTP_INTERCEPTORS, useClass: MyHttpInterceptor, multi: true }],
})
@rootModule({
  imports: [RestModule],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
