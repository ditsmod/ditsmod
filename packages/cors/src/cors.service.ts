import { Injectable, Optional } from '@ts-stack/di';
import { Cookies, CookieOptions } from '@ts-stack/cookies';
import { Req, Res } from '@ditsmod/core';
import { CorsOptions, cors, mergeOptions } from '@ts-stack/cors';

@Injectable()
export class CorsService {
  constructor(private req: Req, private res: Res, @Optional() private corsOptions?: CorsOptions) {}

  setCookie(name: string, value?: any, opts?: CookieOptions) {
    const cookies = new Cookies(this.req.nodeReq, this.res.nodeRes);
    cookies.set(name, value, opts);
    const clonedCorsOptions = { ...(this.corsOptions || {}) };
    clonedCorsOptions.allowCredentials = true;
    cors(this.req.nodeReq, this.res.nodeRes, mergeOptions(clonedCorsOptions));
  }
}
