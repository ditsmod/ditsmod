import { controller, RequestContext } from '@ditsmod/core';
import { route } from '@ditsmod/routing';
import { MulterCtxParser } from '@ditsmod/body-parser';

import { saveFiles, sendHtmlForm } from './utils.js';

@controller({ scope: 'ctx' })
export class CtxController {
  constructor(protected parse: MulterCtxParser) {}

  @route('GET', 'context-scoped')
  tellHello(ctx: RequestContext) {
    ctx.send('Hello, you need send POST request');
  }

  @route('POST', 'context-scoped')
  post(ctx: RequestContext) {
    ctx.sendJson(ctx.body);
  }

  @route('GET', 'context-scoped-file-upload')
  getHtmlForm(ctx: RequestContext) {
    sendHtmlForm(ctx.rawRes);
  }

  @route('POST', 'context-scoped-file-upload')
  async downloadFile(ctx: RequestContext) {
    const parsedForm = await this.parse.array(ctx, 'fieldName', 5);
    await saveFiles(parsedForm);
    ctx.rawRes.writeHead(303, { Connection: 'close', Location: '/context-scoped-file-upload' });
    ctx.rawRes.end();
  }
}
