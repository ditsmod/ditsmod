import { injectable } from '@ditsmod/core';
import { RequestContext, HttpHandler, HttpInterceptor } from '@ditsmod/rest';
import { cors, CorsOptions } from '@ts-stack/cors';

@injectable()
export class CorsInterceptor implements HttpInterceptor {
  constructor(private corsOptions: CorsOptions) {}

  async intercept(next: HttpHandler, reqCtx: RequestContext) {
    const headersSent = cors(reqCtx.rawReq, reqCtx.rawRes, this.corsOptions);
    if (headersSent) {
      return;
    }
    return next.handle();
  }
}
