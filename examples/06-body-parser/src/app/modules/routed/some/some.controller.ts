import { controller, inject, NODE_RES, NodeResponse, Res, route } from '@ditsmod/core';
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
  getHtmlForm(@inject(NODE_RES) nodeRes: NodeResponse) {
    sendHtmlForm(nodeRes);
  }

  @route('POST', 'file-upload')
  async downloadFile(res: Res, parse: MulterParser) {
    const parsedForm = await parse.array('fieldName', 5);
    await saveFiles(parsedForm);
    res.nodeRes.writeHead(303, { Connection: 'close', Location: '/file-upload' });
    res.nodeRes.end();
  }
}
