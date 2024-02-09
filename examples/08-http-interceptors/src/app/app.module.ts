import { HTTP_INTERCEPTORS, rootModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { HelloWorldController, HelloWorldController2 } from './hello-world.controller.js';
import { MyHttpInterceptor, MySingletonHttpInterceptor } from './my-http-interceptor.js';

@rootModule({
  imports: [RoutingModule],
  controllers: [HelloWorldController, HelloWorldController2],
  providersPerRou: [{ token: HTTP_INTERCEPTORS, useClass: MySingletonHttpInterceptor, multi: true }],
  providersPerReq: [{ token: HTTP_INTERCEPTORS, useClass: MyHttpInterceptor, multi: true }],
})
export class AppModule {}
