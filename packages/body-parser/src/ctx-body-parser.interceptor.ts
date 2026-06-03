import { BodyParserGroup } from '@ts-stack/body-parser';
import { injectable } from '@ditsmod/core';
import { RequestContext, HttpHandler, HttpInterceptor } from '@ditsmod/rest';

@injectable()
export class RouteScopedBodyParserInterceptor implements HttpInterceptor {
  constructor(private bodyParserGroup: BodyParserGroup) {}

  async intercept(next: HttpHandler, ctx: RequestContext) {
    ctx.body = await this.bodyParserGroup.parse(ctx.rawReq, ctx.rawReq.headers, {});

    return next.handle();
  }
}
