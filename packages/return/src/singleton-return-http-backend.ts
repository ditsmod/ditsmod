import { injectable, Status, HttpMethod, SingletonRequestContext } from '@ditsmod/core';
import { DefaultSingletonHttpBackend } from '@ditsmod/routing';

@injectable()
export class SingletonReturnHttpBackend extends DefaultSingletonHttpBackend {
  override async handle(ctx: SingletonRequestContext) {
    const value = await super.handle(ctx); // Controller's route returned value.
    if (ctx.httpRes.headersSent) {
      return value;
    }
    let { statusCode } = ctx.httpRes;
    if (!statusCode) {
      const httpMethod = ctx.httpReq.method as HttpMethod;
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

    ctx.httpRes.statusCode = statusCode;
    if (typeof value == 'object' || ctx.httpRes.getHeader('content-type') == 'application/json') {
      ctx.sendJson(value);
    } else {
      ctx.send(value);
    }
  }
}
