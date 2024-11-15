import { controller, inject, RES, HttpResponse, Res } from '@ditsmod/core';
import { route } from '@ditsmod/routing';
import { HTTP_BODY, MulterParser } from '@ditsmod/body-parser';
import { saveFiles, sendHtmlForm } from './utils.js';

interface Body {
  one: number;
}

@controller()
export class SomeController {
  @route('GET')
  tellHello(res: Res) {
    res.send('Hello, you need send POST request');
  }

  @route('POST')
  post(res: Res, @inject(HTTP_BODY) body: Body) {
    res.sendJson(body);
  }

  @route('GET', 'file-upload')
  getHtmlForm(@inject(RES) httpRes: HttpResponse) {
    sendHtmlForm(httpRes);
  }

  @route('POST', 'file-upload')
  async downloadFile(res: Res, parse: MulterParser) {
    const parsedForm = await parse.array('fieldName', 5);
    await saveFiles(parsedForm);
    res.httpRes.writeHead(303, { Connection: 'close', Location: '/file-upload' });
    res.httpRes.end();
  }
}
