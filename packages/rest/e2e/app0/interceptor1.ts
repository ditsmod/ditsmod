import { injectable } from '@ditsmod/core';

import { HttpHandler, HttpInterceptor } from '#interceptors/tokens-and-types.js';
import { RequestContext } from '#services/request-context.js';

@injectable()
export class Interceptor1 implements HttpInterceptor {
  async intercept(next: HttpHandler, ctx: RequestContext) {
    ctx.set('msg', 'ok');
    return next.handle();
  }
}
