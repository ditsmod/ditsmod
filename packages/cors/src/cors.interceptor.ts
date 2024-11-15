import { RequestContext, injectable } from '@ditsmod/core';
import { HttpHandler, HttpInterceptor } from '@ditsmod/routing';
import { cors, CorsOptions } from '@ts-stack/cors';

@injectable()
export class CorsInterceptor implements HttpInterceptor {
  constructor(private corsOptions: CorsOptions) {}

  async intercept(next: HttpHandler, ctx: RequestContext) {
    const headersSent = cors(ctx.httpReq, ctx.httpRes, this.corsOptions);
    if (headersSent) {
      return;
    }
    return next.handle();
  }
}
