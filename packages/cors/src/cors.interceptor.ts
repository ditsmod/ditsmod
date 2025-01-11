import { injectable } from '@ditsmod/core';
import { RequestContext, HttpHandler, HttpInterceptor } from '@ditsmod/routing';
import { cors, CorsOptions } from '@ts-stack/cors';

@injectable()
export class CorsInterceptor implements HttpInterceptor {
  constructor(private corsOptions: CorsOptions) {}

  async intercept(next: HttpHandler, ctx: RequestContext) {
    const headersSent = cors(ctx.rawReq, ctx.rawRes, this.corsOptions);
    if (headersSent) {
      return;
    }
    return next.handle();
  }
}
