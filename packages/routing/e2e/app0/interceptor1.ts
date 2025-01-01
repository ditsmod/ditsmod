import { injectable, Injector, RequestContext } from '@ditsmod/core';
import { HttpHandler, HttpInterceptor } from '#interceptors/tokens-and-types.js';

@injectable()
export class Interceptor1 implements HttpInterceptor {
  constructor(protected injector: Injector) {}

  async intercept(next: HttpHandler, ctx: RequestContext) {
    if (ctx.scope == 'ctx') {
      (ctx as RequestContext & { msg: string }).msg = 'ok';
    } else {
      this.injector.setByToken('msg', 'ok');
    }

    return next.handle();
  }
}
