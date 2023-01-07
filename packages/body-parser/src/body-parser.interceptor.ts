import { HttpHandler, HttpInterceptor, RequestContext } from '@ditsmod/core';
import { injectable, optional } from '@ditsmod/core';
import { parse, Headers, Options } from 'get-body';

import { BodyParserConfig } from './body-parser-config';

@injectable()
export class BodyParserInterceptor implements HttpInterceptor {
  constructor(private ctx: RequestContext, @optional() private config?: BodyParserConfig) {
    this.config = Object.assign({}, new BodyParserConfig(), config); // Merge with default.
  }

  async intercept(next: HttpHandler) {
    const contentType = this.ctx.nodeReq.headers['content-type'];
    const hasAcceptableHeaders = this.config?.acceptHeaders?.some((type) => contentType?.includes(type));
    if (!hasAcceptableHeaders) {
      return next.handle();
    }
    const options: Options = { limit: this.config?.maxBodySize };
    this.ctx.req.body = await parse(this.ctx.nodeReq, this.ctx.nodeReq.headers as Headers, options);

    return next.handle();
  }
}
