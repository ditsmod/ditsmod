import { parse } from 'querystring';
import { AnyObj, injectable, Injector } from '@ditsmod/core';

import { DefaultCtxHttpFrontend } from './default-ctx-http-frontend.js';
import { RequestContext } from '#services/request-context.js';
import { PATH_PARAMS, QUERY_PARAMS } from '../constants.js';

@injectable()
export class DefaultHttpFrontend extends DefaultCtxHttpFrontend {
  constructor(private injector: Injector) {
    super();
  }

  override before(ctx: RequestContext) {
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
}
