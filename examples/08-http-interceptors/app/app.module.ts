import { HTTP_INTERCEPTORS, RootModule, Router } from '@ditsmod/core';
import { DefaultRouter } from '@ditsmod/router';

import { HelloWorldController } from './hello-world.controller';
import { MyHttpInterceptor } from './my-http-interceptor';

@RootModule({
  controllers: [HelloWorldController],
  providersPerApp: [{ provide: Router, useClass: DefaultRouter }],
  providersPerReq: [{ provide: HTTP_INTERCEPTORS, useClass: MyHttpInterceptor, multi: true }],
})
export class AppModule {}
