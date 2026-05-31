import { type ServerResponse } from 'node:http';
import { RequestContext, controller, route } from '@ditsmod/rest';
import { RouteScopedMulterParser } from '@ditsmod/body-parser';

import { saveFiles, sendHtmlForm } from './utils.js';

@controller({ scope: 'route' })
export class RouteScopedController {
  constructor(protected parse: RouteScopedMulterParser) {}

  @route('GET', 'route-scoped')
  tellHello(reqCtx: RequestContext) {
    reqCtx.send('Hello, you need send POST request');
  }

  @route('POST', 'route-scoped')
  post(reqCtx: RequestContext) {
    reqCtx.sendJson(reqCtx.body);
  }

  @route('GET', 'route-scoped-file-upload')
  getHtmlForm(reqCtx: RequestContext) {
    sendHtmlForm(reqCtx.rawRes);
  }

  @route('POST', 'route-scoped-file-upload')
  async downloadFile(reqCtx: RequestContext) {
    const parsedForm = await this.parse.array(reqCtx, 'fieldName', 5);
    await saveFiles(parsedForm);
    // @todo Refactoring this for HTTP2
    (reqCtx.rawRes as ServerResponse).writeHead(303, { Connection: 'close', Location: '/route-scoped-file-upload' });
    reqCtx.rawRes.end();
  }
}
