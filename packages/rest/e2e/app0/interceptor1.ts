import { injectable, Context } from '@ditsmod/core';
import { HttpHandler, HttpInterceptor } from '#interceptors/tokens-and-types.js';

@injectable()
export class Interceptor1 implements HttpInterceptor {
  async intercept(next: HttpHandler, ctx: Context) {
    ctx.set('msg', 'ok');
    return next.handle();
  }
}
