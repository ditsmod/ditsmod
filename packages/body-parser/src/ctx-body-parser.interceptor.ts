import { BodyParserGroup } from '@ts-stack/body-parser';
import { injectable } from '@ditsmod/core';
import { RequestContext, HttpHandler, HttpInterceptor } from '@ditsmod/rest';

@injectable()
export class RouteScopedBodyParserInterceptor implements HttpInterceptor {
  constructor(private bodyParserGroup: BodyParserGroup) {}

  async intercept(next: HttpHandler, reqCtx: RequestContext) {
    reqCtx.body = await this.bodyParserGroup.parse(reqCtx.rawReq, reqCtx.rawReq.headers, {});

    return next.handle();
  }
}
