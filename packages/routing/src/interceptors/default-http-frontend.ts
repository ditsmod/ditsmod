import { parse } from 'querystring';
import {
  AnyObj,
  HttpMethod,
  injectable,
  Injector,
  PATH_PARAMS,
  QUERY_PARAMS,
  RequestContext,
  Status,
} from '@ditsmod/core';

import { HttpFrontend, HttpHandler } from './tokens-and-types.js';
import { SILENT_RES } from '../constants.js';

@injectable()
export class DefaultHttpFrontend implements HttpFrontend {
  constructor(private injector: Injector) {}

  async intercept(next: HttpHandler, ctx: RequestContext) {
    if (ctx.queryString) {
      this.injector.setByToken(QUERY_PARAMS, parse(ctx.queryString));
    }
    if (ctx.aPathParams?.length) {
      const pathParams: AnyObj = {};
      ctx.aPathParams.forEach((param) => (pathParams[param.key] = param.value));
      this.injector.setByToken(PATH_PARAMS, pathParams);
    }
    this.send(ctx, await next.handle()); // Controller's route returned value.
  }

  send(ctx: RequestContext, val: any) {
    if (ctx.rawRes.headersSent || val === SILENT_RES) {
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
