import { HttpHandler, HttpInterceptor, Req, Res } from '@ditsmod/core';
import { cors } from '@ts-stack/cors';
import { Injectable } from '@ts-stack/di';

import { MergedCorsOptions } from './merged-cors-options';

@Injectable()
export class CorsInterceptor implements HttpInterceptor {
  constructor(private req: Req, private res: Res, private mergedCorsOptions: MergedCorsOptions) {}

  async intercept(next: HttpHandler) {
    await cors(this.req.nodeReq, this.res.nodeRes, this.mergedCorsOptions);
    return next.handle();
  }
}
