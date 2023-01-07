import { HttpHandler, HttpInterceptor, Req, RequestContext, RouteMeta } from '@ditsmod/core';
import { injectable, optional } from '@ditsmod/core';
import { parse, Headers, Options } from 'get-body';

import { BodyParserConfig } from './body-parser-config';

@injectable()
export class BodyParserInterceptor implements HttpInterceptor {
  constructor(@optional() private config?: BodyParserConfig) {
    this.config = Object.assign({}, new BodyParserConfig(), config); // Merge with default.
  }

  async intercept(ctx: RequestContext, next: HttpHandler) {
    const contentType = ctx.nodeReq.headers['content-type'];
    const hasAcceptableHeaders = this.config?.acceptHeaders?.some((type) => contentType?.includes(type));
    if (!hasAcceptableHeaders) {
      return next.handle(ctx);
    }
    const options: Options = { limit: this.config?.maxBodySize };
    ctx.req.body = await parse(ctx.nodeReq, ctx.nodeReq.headers as Headers, options);

    return next.handle(ctx);
  }
}
