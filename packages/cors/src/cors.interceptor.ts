import { HttpHandler, HttpInterceptor, RequestContext } from '@ditsmod/core';
import { cors, CorsOptions } from '@ts-stack/cors';
import { injectable } from '@ditsmod/core';

@injectable()
export class CorsInterceptor implements HttpInterceptor {
  constructor(private corsOptions: CorsOptions) {}

  async intercept(ctx: RequestContext, next: HttpHandler) {
    const headersSent = cors(ctx.nodeReq, ctx.nodeRes, this.corsOptions);
    if (headersSent) {
      return;
    }
    return next.handle(ctx);
  }
}
