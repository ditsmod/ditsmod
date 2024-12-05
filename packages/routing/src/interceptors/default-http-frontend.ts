import { parse } from 'querystring';
import { AnyObj, injectable, Injector, PATH_PARAMS, QUERY_PARAMS, RequestContext } from '@ditsmod/core';

import { DefaultSingletonHttpFrontend } from './default-singleton-http-frontend.js';

@injectable()
export class DefaultHttpFrontend extends DefaultSingletonHttpFrontend {
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
