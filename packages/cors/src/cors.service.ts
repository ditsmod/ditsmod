import { inject, injectable, NodeRequest, NodeResponse, NODE_REQ, NODE_RES, optional } from '@ditsmod/core';
import { Cookies, CookieOptions } from '@ts-stack/cookies';
import { CorsOptions, cors, mergeOptions } from '@ts-stack/cors';

@injectable()
export class CorsService {
  constructor(
    @inject(NODE_REQ) private nodeReq: NodeRequest,
    @inject(NODE_RES) private nodeRes: NodeResponse,
    @optional() private corsOptions?: CorsOptions
  ) {}

  setCookie(name: string, value?: any, opts?: CookieOptions) {
    const cookies = new Cookies(this.nodeReq, this.nodeRes);
    cookies.set(name, value, opts);
    const clonedCorsOptions = { ...(this.corsOptions || {}) };
    clonedCorsOptions.allowCredentials = true;
    cors(this.nodeReq, this.nodeRes, mergeOptions(clonedCorsOptions));
  }
}
