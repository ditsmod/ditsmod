import { injectable } from '@holu/core';
import { HttpHandler, HttpInterceptor, RequestContext } from '@holu/rest';

@injectable()
export class MyHttpInterceptor implements HttpInterceptor {
  async intercept(next: HttpHandler, ctx: RequestContext) {
    const val = await next.handle();

    return val;
  }
}
