import { HttpHandler, HttpInterceptor, InterceptorContext } from '@ditsmod/core';
import { cors, CorsOptions } from '@ts-stack/cors';
import { injectable } from '@ditsmod/core';

@injectable()
export class CorsInterceptor implements HttpInterceptor {
  constructor(private corsOptions: CorsOptions) {}

  async intercept(next: HttpHandler, ctx: InterceptorContext) {
    const headersSent = cors(ctx.nodeReq, ctx.nodeRes, this.corsOptions);
    if (headersSent) {
      return;
    }
    return next.handle();
  }
}
