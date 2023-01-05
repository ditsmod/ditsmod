import { injectable, Injector, RequestContext } from '@ditsmod/core';
import { HttpBackend, Res, DefaultHttpBackend, Status, HttpMethod } from '@ditsmod/core';

@injectable()
export class ReturnHttpBackend extends DefaultHttpBackend implements HttpBackend {
  constructor(protected override injector: Injector, protected res: Res) {
    super(injector);
  }

  override async handle(ctx: RequestContext) {
    const value = await super.handle(ctx); // Controller's route returned value.
    let { statusCode } = this.res.nodeRes;
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

    if (typeof value == 'object' || this.res.nodeRes.getHeader('content-type') == 'application/json') {
      this.res.sendJson(value, statusCode);
    } else {
      this.res.send(value, statusCode);
    }
  }
}
