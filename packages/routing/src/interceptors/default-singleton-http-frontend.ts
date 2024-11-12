import { parse } from 'node:querystring';
import { AnyObj, injectable, SingletonRequestContext } from '@ditsmod/core';

import { HttpFrontend, HttpHandler } from './tokens-and-types.js';

@injectable()
export class DefaultSingletonHttpFrontend implements HttpFrontend {
  async intercept(next: HttpHandler, ctx: SingletonRequestContext) {
    if (ctx.queryString) {
      ctx.queryParams = parse(ctx.queryString);
    }
    if (ctx.aPathParams?.length) {
      const pathParams: AnyObj = {};
      ctx.aPathParams.forEach((param) => (pathParams[param.key] = param.value));
      ctx.pathParams = pathParams;
    }
    return next.handle();
  }
}
