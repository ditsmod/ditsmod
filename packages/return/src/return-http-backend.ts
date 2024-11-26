import { inject, injectable, Injector, RawRequest, RAW_REQ, Res, skipSelf, Status, HttpMethod } from '@ditsmod/core';
import { DefaultHttpBackend, RouteMeta } from '@ditsmod/routing';

@injectable()
export class ReturnHttpBackend extends DefaultHttpBackend {
  constructor(
    @inject(RAW_REQ) protected rawReq: RawRequest,
    @skipSelf() protected override routeMeta: RouteMeta,
    protected override injector: Injector,
    protected res: Res,
  ) {
    super(injector, routeMeta);
  }

  override async handle() {
    const value = await super.handle(); // Controller's route returned value.
    if (this.res.rawRes.headersSent) {
      return value;
    }
    let { statusCode } = this.res.rawRes;
    if (!statusCode) {
      const httpMethod = this.rawReq.method as HttpMethod;
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

    if (
      typeof value == 'object' ||
      this.res.rawRes.getHeader('content-type')?.toString().includes('application/json')
    ) {
      this.res.sendJson(value, statusCode);
    } else {
      this.res.send(value, statusCode);
    }

    return value;
  }
}
