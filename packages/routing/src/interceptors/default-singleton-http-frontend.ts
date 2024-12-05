import { parse } from 'node:querystring';
import { AnyObj, HttpMethod, injectable, RequestContext, SingletonRequestContext, Status } from '@ditsmod/core';

import { HttpFrontend, HttpHandler } from './tokens-and-types.js';

@injectable()
export class DefaultSingletonHttpFrontend implements HttpFrontend {
  async intercept(next: HttpHandler, ctx: SingletonRequestContext) {
    this.before(ctx).after(ctx, await next.handle());
  }

  /**
   * This method is called before `intercept()`.
   */
  before(ctx: SingletonRequestContext) {
    if (ctx.queryString) {
      ctx.queryParams = parse(ctx.queryString);
    }
    if (ctx.aPathParams?.length) {
      const pathParams: AnyObj = {};
      ctx.aPathParams.forEach((param) => (pathParams[param.key] = param.value));
      ctx.pathParams = pathParams;
    }
    return this;
  }

  /**
   * This method is called after `intercept()`.
   */
  after(ctx: RequestContext, val: any) {
    if (ctx.rawRes.headersSent) {
      return;
    }
    let { statusCode } = ctx.rawRes;
    if (!statusCode) {
      const httpMethod = ctx.rawReq.method as HttpMethod;
      if (httpMethod == 'GET') {
        statusCode = Status.OK;
      } else if (httpMethod == 'POST') {
        statusCode = Status.CREATED;
      } else if (httpMethod == 'OPTIONS') {
        statusCode = Status.NO_CONTENT;
      } else {
        statusCode = Status.OK;
      }
    }

    if (typeof val == 'object' || ctx.rawRes.getHeader('content-type')?.toString().includes('application/json')) {
      ctx.sendJson(val, statusCode);
    } else {
      ctx.send(val, statusCode);
    }
  }
}
