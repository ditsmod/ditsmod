import { parse } from 'querystring';
import { AnyObj, injectable, Injector, PATH_PARAMS, QUERY_PARAMS, RequestContext } from '@ditsmod/core';

import { HttpFrontend, HttpHandler } from './tokens-and-types.js';
import { DefaultSingletonHttpFrontend } from './default-singleton-http-frontend.js';

const singleton = new DefaultSingletonHttpFrontend();

@injectable()
export class DefaultHttpFrontend implements HttpFrontend {
  constructor(private injector: Injector) {}
  async intercept(next: HttpHandler, ctx: RequestContext) {
    this.before(ctx).after(ctx, await next.handle());
  }

  protected before(ctx: RequestContext) {
    if (ctx.queryString) {
      this.injector.setByToken(QUERY_PARAMS, parse(ctx.queryString));
    }
    if (ctx.aPathParams?.length) {
      const pathParams: AnyObj = {};
      ctx.aPathParams.forEach((param) => (pathParams[param.key] = param.value));
      this.injector.setByToken(PATH_PARAMS, pathParams);
    }
    return this;
  }

  protected after(ctx: RequestContext, val: any) {
    singleton.after(ctx, val);
  }
}
