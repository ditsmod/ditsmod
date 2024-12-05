import { injectable, RequestContext } from '@ditsmod/core';
import { HttpHandler, HttpInterceptor } from '@ditsmod/routing';

@injectable()
export class MyHttpInterceptor implements HttpInterceptor {
  async intercept(next: HttpHandler, ctx: RequestContext) {
    const val = await next.handle();

    return val;
  }
}
