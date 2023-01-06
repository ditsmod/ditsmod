import { injectable, Injector, RequestContext } from '@ditsmod/core';
import { HttpBackend, DefaultHttpBackend, Status, HttpMethod } from '@ditsmod/core';

@injectable()
export class ReturnHttpBackend extends DefaultHttpBackend implements HttpBackend {
  constructor(protected override injector: Injector) {
    super(injector);
  }

  override async handle(ctx: RequestContext) {
    const value = await super.handle(ctx); // Controller's route returned value.
    let { statusCode } = ctx.nodeRes;
    if (!statusCode) {
      const httpMethod = ctx.nodeReq.method as HttpMethod;
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

    if (typeof value == 'object' || ctx.nodeRes.getHeader('content-type') == 'application/json') {
      ctx.res.sendJson(value, statusCode);
    } else {
      ctx.res.send(value, statusCode);
    }
  }
}
