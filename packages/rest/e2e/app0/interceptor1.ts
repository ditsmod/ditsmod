import { injectable, Context } from '@ditsmod/core';

import { HttpHandler, HttpInterceptor } from '#interceptors/tokens-and-types.js';
import { RequestContext } from '#services/request-context.js';

@injectable()
export class Interceptor1 implements HttpInterceptor {
  constructor(protected ctx: Context) {}

  async intercept(next: HttpHandler, ctx: RequestContext) {
    if (ctx.scope == 'ctx') {
      (ctx as RequestContext & { msg: string }).msg = 'ok';
    } else {
      this.ctx.set('msg', 'ok');
    }

    return next.handle();
  }
}
