import { HTTP_INTERCEPTORS, RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { HelloWorldController } from './hello-world.controller';
import { MyHttpInterceptor } from './my-http-interceptor';

@RootModule({
  imports: [RouterModule],
  controllers: [HelloWorldController],
  providersPerReq: [{ token: HTTP_INTERCEPTORS, useClass: MyHttpInterceptor, multi: true }],
})
export class AppModule {}
