import { parse } from 'node:querystring';
import { AnyObj, HttpMethod, injectable, Status } from '@ditsmod/core';
import { CustomError } from '@ditsmod/core/errors';

import { HttpFrontend, HttpHandler } from './tokens-and-types.js';
import { RequestContext } from '#services/request-context.js';

@injectable()
export class RouteScopedDefaultHttpFrontend implements HttpFrontend {
  async intercept(next: HttpHandler, reqCtx: RequestContext) {
    this.before(reqCtx).after(reqCtx, await next.handle());
  }

  /**
   * This method is called before `intercept()`.
   */
  before(reqCtx: RequestContext) {
    if (reqCtx.queryString) {
      reqCtx.queryParams = parse(reqCtx.queryString);
    }
    if (reqCtx.aPathParams?.length) {
      const pathParams: AnyObj = {};
      reqCtx.aPathParams.forEach((param) => (pathParams[param.key] = param.value));
      reqCtx.pathParams = pathParams;
    }
    return this;
  }

  /**
   * This method is called after `intercept()`.
   */
  after(reqCtx: RequestContext, val: string | object | Uint8Array | undefined) {
    if (reqCtx.rawRes.headersSent) {
      return;
    }
    if (!reqCtx.rawRes.statusCode) {
      const httpMethod = reqCtx.rawReq.method as HttpMethod;
      if (httpMethod == 'GET') {
        reqCtx.rawRes.statusCode = Status.OK;
      } else if (httpMethod == 'POST') {
        reqCtx.rawRes.statusCode = Status.CREATED;
      } else if (httpMethod == 'OPTIONS') {
        reqCtx.rawRes.statusCode = Status.NO_CONTENT;
      }
    }

    const rawType = reqCtx.rawRes.getHeader('content-type');
    const contentType = typeof rawType == 'string' ? rawType : undefined;
    if ((typeof val == 'object' && val !== null) || contentType?.startsWith('application/json')) {
      reqCtx.sendJson(val);
    } else if (contentType && !val) {
      this.throwTypeError(reqCtx, contentType);
    } else {
      if (typeof val == 'string' && !contentType) {
        reqCtx.rawRes.setHeader('content-type', 'text/plain; charset=utf-8');
      }
      reqCtx.send(val);
    }
  }

  protected throwTypeError(reqCtx: RequestContext, contentType?: string | number | string[]) {
    const msg1 = 'Internal Server Error';
    const route = JSON.stringify({ method: reqCtx.rawReq.method, url: reqCtx.rawReq.url });
    let msg2 = `The request handler with route ${route} set the data type to "${contentType}"`;
    msg2 += ' but did not send the response body. Make sure your handler returns a value.';
    throw new CustomError({ msg1, msg2, level: 'error', status: Status.INTERNAL_SERVER_ERROR });
  }
}
