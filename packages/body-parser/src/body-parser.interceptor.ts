import { HttpHandler, HttpInterceptor, Req } from '@ditsmod/core';
import { Injectable, Optional } from '@ts-stack/di';
import { parse, Headers, Options } from 'get-body';

import { BodyParserConfig } from './body-parser-config';

@Injectable()
export class BodyParserInterceptor implements HttpInterceptor {
  constructor(private req: Req, @Optional() private config?: BodyParserConfig) {
    this.config = Object.assign({}, new BodyParserConfig(), config); // Merge with default.
  }

  async intercept(next: HttpHandler) {
    const contentType = this.req.nodeReq.headers['content-type'];
    const hasAcceptableHeaders = this.config?.acceptHeaders?.some((type) => contentType?.includes(type));
    if (!hasAcceptableHeaders) {
      return next.handle();
    }
    const options: Options = { limit: this.config?.maxBodySize };
    this.req.body = await parse(this.req.nodeReq, this.req.nodeReq.headers as Headers, options);

    return next.handle();
  }
}
