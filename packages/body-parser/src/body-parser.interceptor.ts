import { HttpHandler, HttpInterceptor, Injector, RequestContext } from '@ditsmod/core';
import { injectable, optional } from '@ditsmod/core';
import { parse, Headers, Options } from 'get-body';

import { HTTP_BODY, BodyParserConfig } from './body-parser-config.js';

@injectable()
export class BodyParserInterceptor implements HttpInterceptor {
  constructor(
    private injector: Injector,
    @optional() private config?: BodyParserConfig,
  ) {
    this.config = Object.assign({}, new BodyParserConfig(), config); // Merge with default.
  }

  async intercept(next: HttpHandler, ctx: RequestContext) {
    const contentType = ctx.nodeReq.headers['content-type'];
    const hasAcceptableHeaders = this.config?.acceptHeaders?.some((type) => contentType?.includes(type));
    if (!hasAcceptableHeaders) {
      return next.handle();
    }
    const options: Options = { limit: this.config?.maxBodySize };
    const body = await parse(ctx.nodeReq, ctx.nodeReq.headers as Headers, options);
    this.injector.setByToken(HTTP_BODY, body);

    return next.handle();
  }
}
