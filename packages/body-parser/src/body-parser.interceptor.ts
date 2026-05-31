import { injectable, Context } from '@ditsmod/core';
import { RequestContext, HttpHandler, HttpInterceptor } from '@ditsmod/rest';
import { BodyParserGroup } from '@ts-stack/body-parser';

import { HTTP_BODY } from './body-parser-config.js';

@injectable()
export class BodyParserInterceptor implements HttpInterceptor {
  constructor(
    private ctx: Context,
    private bodyParserGroup: BodyParserGroup,
  ) {}

  async intercept(next: HttpHandler, reqCtx: RequestContext) {
    reqCtx.body = await this.bodyParserGroup.parse(reqCtx.rawReq, reqCtx.rawReq.headers, {});
    this.ctx.set(HTTP_BODY, reqCtx.body);

    return next.handle();
  }
}
