import { HttpHandler, HttpInterceptor, RequestContext } from '@ditsmod/core';
import { cors, CorsOptions } from '@ts-stack/cors';
import { injectable } from '@ditsmod/core';

@injectable()
export class CorsInterceptor implements HttpInterceptor {
  constructor(private corsOptions: CorsOptions, private ctx: RequestContext) {}

  async intercept(next: HttpHandler) {
    const headersSent = cors(this.ctx.nodeReq, this.ctx.nodeRes, this.corsOptions);
    if (headersSent) {
      return;
    }
    return next.handle();
  }
}
