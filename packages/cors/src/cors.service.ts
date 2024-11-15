import { inject, injectable, HttpRequest, HttpResponse, REQ, RES, optional } from '@ditsmod/core';
import { Cookies, CookieOptions } from '@ts-stack/cookies';
import { CorsOptions, cors, mergeOptions } from '@ts-stack/cors';

@injectable()
export class CorsService {
  constructor(
    @inject(REQ) private httpReq: HttpRequest,
    @inject(RES) private httpRes: HttpResponse,
    @optional() private corsOptions?: CorsOptions
  ) {}

  setCookie(name: string, value?: any, opts?: CookieOptions) {
    const cookies = new Cookies(this.httpReq, this.httpRes);
    cookies.set(name, value, opts);
    const clonedCorsOptions = { ...(this.corsOptions || {}) };
    clonedCorsOptions.allowCredentials = true;
    cors(this.httpReq, this.httpRes, mergeOptions(clonedCorsOptions));
  }
}
