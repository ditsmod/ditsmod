import { inject, injectable, optional } from '@ditsmod/core';
import { RawRequest, RawResponse, RAW_REQ, RAW_RES } from '@ditsmod/rest';
import { Cookies, CookieOptions } from '@ts-stack/cookies';
import { CorsOptions, cors, mergeOptions } from '@ts-stack/cors';

@injectable()
export class CorsService {
  constructor(
    @inject(RAW_REQ) private rawReq: RawRequest,
    @inject(RAW_RES) private rawRes: RawResponse,
    @optional() private corsOptions?: CorsOptions
  ) {}

  setCookie(name: string, value?: any, opts?: CookieOptions) {
    const cookies = new Cookies(this.rawReq, this.rawRes);
    cookies.set(name, value, opts);
    const clonedCorsOptions = { ...(this.corsOptions || {}) };
    clonedCorsOptions.allowCredentials = true;
    cors(this.rawReq, this.rawRes, mergeOptions(clonedCorsOptions));
  }
}
