import { type ServerResponse } from 'node:http';
import { RequestContext, controller, route } from '@ditsmod/rest';
import { MulterCtxParser } from '@ditsmod/body-parser';

import { saveFiles, sendHtmlForm } from './utils.js';

@controller({ scope: 'ctx' })
export class CtxController {
  constructor(protected parse: MulterCtxParser) {}

  @route('GET', 'route-scoped')
  tellHello(ctx: RequestContext) {
    ctx.send('Hello, you need send POST request');
  }

  @route('POST', 'route-scoped')
  post(ctx: RequestContext) {
    ctx.sendJson(ctx.body);
  }

  @route('GET', 'route-scoped-file-upload')
  getHtmlForm(ctx: RequestContext) {
    sendHtmlForm(ctx.rawRes);
  }

  @route('POST', 'route-scoped-file-upload')
  async downloadFile(ctx: RequestContext) {
    const parsedForm = await this.parse.array(ctx, 'fieldName', 5);
    await saveFiles(parsedForm);
    // @todo Refactoring this for HTTP2
    (ctx.rawRes as ServerResponse).writeHead(303, { Connection: 'close', Location: '/route-scoped-file-upload' });
    ctx.rawRes.end();
  }
}
