import { parse } from 'querystring';

import { PATH_PARAMS, QUERY_PARAMS } from '#constans';
import { Injector, injectable } from '#di';
import { HttpFrontend, HttpHandler, InterceptorContext } from '#types/http-interceptor.js';
import { AnyObj } from '#types/mix.js';

@injectable()
export class DefaultHttpFrontend implements HttpFrontend {
  constructor(private injector: Injector) {}

  async intercept(next: HttpHandler, ctx: InterceptorContext) {
    if (ctx.queryString) {
      this.injector.setByToken(QUERY_PARAMS, parse(ctx.queryString));
    }
    if (ctx.aPathParams?.length) {
      const pathParams: AnyObj = {};
      ctx.aPathParams.forEach((param) => (pathParams[param.key] = param.value));
      this.injector.setByToken(PATH_PARAMS, pathParams);
    }
    return next.handle();
  }
}
