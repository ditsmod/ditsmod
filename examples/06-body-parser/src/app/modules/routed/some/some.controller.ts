import { type ServerResponse } from 'node:http';
import { ctx } from '@ditsmod/core';
import { controller, route, RAW_RES, RawResponse, RequestContext } from '@ditsmod/rest';
import { HTTP_BODY, MulterParser } from '@ditsmod/body-parser';

import { saveFiles, sendHtmlForm } from './utils.js';

interface Body {
  one: number;
}

@controller()
export class RequestScopedController {
  @route('GET')
  tellHello(ctx: RequestContext) {
    ctx.send('Hello, you need send POST request');
  }

  @route('POST')
  post(ctx: RequestContext, @ctx(HTTP_BODY) body: Body) {
    ctx.sendJson(body);
  }

  @route('GET', 'file-upload')
  getHtmlForm(@ctx(RAW_RES) rawRes: RawResponse) {
    sendHtmlForm(rawRes);
  }

  @route('POST', 'file-upload')
  async downloadFile(ctx: RequestContext, parse: MulterParser) {
    const parsedForm = await parse.array('fieldName', 5);
    await saveFiles(parsedForm);
    // @todo Refactoring this for HTTP2
    (ctx.rawRes as ServerResponse).writeHead(303, { Connection: 'close', Location: '/file-upload' });
    ctx.rawRes.end();
  }
}
