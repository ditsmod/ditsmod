import { HttpHandler, HttpInterceptor, RequestContext, injectable } from '@ditsmod/core';
import { cors, CorsOptions } from '@ts-stack/cors';

@injectable()
export class CorsInterceptor implements HttpInterceptor {
  constructor(private corsOptions: CorsOptions) {}

  async intercept(next: HttpHandler, ctx: RequestContext) {
    const headersSent = cors(ctx.nodeReq, ctx.nodeRes, this.corsOptions);
    if (headersSent) {
      return;
    }
    return next.handle();
  }
}
