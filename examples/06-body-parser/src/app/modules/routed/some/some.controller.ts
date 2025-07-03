import { inject } from '@ditsmod/core';
import { controller, route, RAW_RES, RawResponse, Res } from '@ditsmod/rest';
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
  getHtmlForm(@inject(RAW_RES) rawRes: RawResponse) {
    sendHtmlForm(rawRes);
  }

  @route('POST', 'file-upload')
  async downloadFile(res: Res, parse: MulterParser) {
    const parsedForm = await parse.array('fieldName', 5);
    await saveFiles(parsedForm);
    res.rawRes.writeHead(303, { Connection: 'close', Location: '/file-upload' });
    res.rawRes.end();
  }
}
