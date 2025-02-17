import { Providers, rootModule } from '@ditsmod/core';
import { HTTP_INTERCEPTORS, RoutingModule } from '@ditsmod/routing';

import { HelloWorldController, HelloWorldController2 } from './hello-world.controller.js';
import { MyHttpInterceptor } from './my-http-interceptor.js';

@rootModule({
  imports: [RoutingModule],
  controllers: [HelloWorldController, HelloWorldController2],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
  providersPerRou: [{ token: HTTP_INTERCEPTORS, useClass: MyHttpInterceptor, multi: true }],
  providersPerReq: [{ token: HTTP_INTERCEPTORS, useClass: MyHttpInterceptor, multi: true }],
})
export class AppModule {}
