import { injectable, Context } from '@ditsmod/core';

import { HttpHandler, HttpInterceptor } from '#interceptors/tokens-and-types.js';
import { RequestContext } from '#services/request-context.js';

@injectable()
export class Interceptor1 implements HttpInterceptor {
  async intercept(next: HttpHandler, reqCtx: RequestContext) {
    if (reqCtx.scope == 'route') {
      (reqCtx as RequestContext & { msg: string }).msg = 'ok';
    } else {
      reqCtx.set('msg', 'ok');
    }

    return next.handle();
  }
}
