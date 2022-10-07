import { HttpHandler, HttpInterceptor, Req, Res } from '@ditsmod/core';
import { cors, CorsOptions } from '@ts-stack/cors';
import { Injectable } from '@ts-stack/di';

@Injectable()
export class CorsInterceptor implements HttpInterceptor {
  constructor(private req: Req, private res: Res, private corsOptions: CorsOptions) {}

  async intercept(next: HttpHandler) {
    const headersSent = cors(this.req.nodeReq, this.res.nodeRes, this.corsOptions);
    if (headersSent) {
      return;
    }
    return next.handle();
  }
}
