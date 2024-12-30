import { controller, RequestContext } from '@ditsmod/core';
import { route } from '@ditsmod/routing';
import { MulterSingletonParser } from '@ditsmod/body-parser';

import { saveFiles, sendHtmlForm } from './utils.js';

@controller({ scope: 'ctx' })
export class SingletonController {
  constructor(protected parse: MulterSingletonParser) {}

  @route('GET', 'singleton')
  tellHello(ctx: RequestContext) {
    ctx.send('Hello, you need send POST request');
  }

  @route('POST', 'singleton')
  post(ctx: RequestContext) {
    ctx.sendJson(ctx.body);
  }

  @route('GET', 'singleton-file-upload')
  getHtmlForm(ctx: RequestContext) {
    sendHtmlForm(ctx.rawRes);
  }

  @route('POST', 'singleton-file-upload')
  async downloadFile(ctx: RequestContext) {
    const parsedForm = await this.parse.array(ctx, 'fieldName', 5);
    await saveFiles(parsedForm);
    ctx.rawRes.writeHead(303, { Connection: 'close', Location: '/singleton-file-upload' });
    ctx.rawRes.end();
  }
}
