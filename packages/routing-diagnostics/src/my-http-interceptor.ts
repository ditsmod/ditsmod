import { injectable } from '@ditsmod/core';
import { HttpHandler, HttpInterceptor, RequestContext } from '@ditsmod/routing';

@injectable()
export class MyHttpInterceptor implements HttpInterceptor {
  async intercept(next: HttpHandler, ctx: RequestContext) {
    const val = await next.handle();

    return val;
  }
}
