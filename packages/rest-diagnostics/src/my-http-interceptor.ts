import { injectable } from '@ditsmod/core';
import { HttpHandler, HttpInterceptor, RequestContext } from '@ditsmod/rest';

@injectable()
export class MyHttpInterceptor implements HttpInterceptor {
  async intercept(next: HttpHandler, reqCtx: RequestContext) {
    const val = await next.handle();

    return val;
  }
}
