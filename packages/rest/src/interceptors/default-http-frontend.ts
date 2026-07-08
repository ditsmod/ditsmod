import { parse } from 'querystring';
import { AnyObj, injectable, Context } from '@ditsmod/core';

import { DefaultHttpFrontendPerRou } from './default-http-frontend-per-rou.js';
import { RequestContext } from '#services/request-context.js';
import { PATH_PARAMS, QUERY_PARAMS } from '../top/constants.js';

@injectable()
export class DefaultHttpFrontend extends DefaultHttpFrontendPerRou {
  constructor(private ctx: Context) {
    super();
  }

  override before(ctx: RequestContext) {
    if (ctx.queryString) {
      this.ctx.set(QUERY_PARAMS, parse(ctx.queryString));
    }
    if (ctx.aPathParams?.length) {
      const pathParams: AnyObj = {};
      ctx.aPathParams.forEach((param) => (pathParams[param.key] = param.value));
      this.ctx.set(PATH_PARAMS, pathParams);
    }
    return this;
  }
}
