import { HttpHandler, HttpInterceptor, inject, NodeRequest, NodeResponse, NODE_REQ, NODE_RES } from '@ditsmod/core';
import { cors, CorsOptions } from '@ts-stack/cors';
import { injectable } from '@ditsmod/core';

@injectable()
export class CorsInterceptor implements HttpInterceptor {
  constructor(
    private corsOptions: CorsOptions,
    @inject(NODE_REQ) private nodeReq: NodeRequest,
    @inject(NODE_RES) private nodeRes: NodeResponse,
  ) {}

  async intercept(next: HttpHandler) {
    const headersSent = cors(this.nodeReq, this.nodeRes, this.corsOptions);
    if (headersSent) {
      return;
    }
    return next.handle();
  }
}
