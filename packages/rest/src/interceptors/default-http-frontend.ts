import { parse } from 'querystring';
import { AnyObj, injectable, Context } from '@ditsmod/core';

import { RouteScopedDefaultHttpFrontend } from './default-ctx-http-frontend.js';
import { RequestContext } from '#services/request-context.js';
import { PATH_PARAMS, QUERY_PARAMS } from '#types/constants.js';

@injectable()
export class DefaultHttpFrontend extends RouteScopedDefaultHttpFrontend {
  constructor(private ctx: Context) {
    super();
  }

  override before(reqCtx: RequestContext) {
    if (reqCtx.queryString) {
      this.ctx.set(QUERY_PARAMS, parse(reqCtx.queryString));
    }
    if (reqCtx.aPathParams?.length) {
      const pathParams: AnyObj = {};
      reqCtx.aPathParams.forEach((param) => (pathParams[param.key] = param.value));
      this.ctx.set(PATH_PARAMS, pathParams);
    }
    return this;
  }
}
