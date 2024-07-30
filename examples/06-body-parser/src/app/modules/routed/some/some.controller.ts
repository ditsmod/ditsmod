import { createWriteStream } from 'node:fs';
import { controller, inject, Res, route } from '@ditsmod/core';
import { MulterParsedForm, HTTP_BODY, MulterHelper } from '@ditsmod/body-parser';

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
  getHtmlForm(res: Res) {
    res.setContentType('text/html').send(`
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Uploads files</title>
</head>
<body>
    <form method="post" enctype="multipart/form-data">
        <label for="files">Select files:</label>
        <input type="file" id="files" name="files" multiple>
        <br>
        <input type="submit">
    </form>
</body>
</html>
      `);
  }

  @route('POST', 'file-upload')
  async downloadFile(res: Res, parse: MulterHelper) {
    const parsedForm = await parse.array('files', 5);
    await this.saveFiles(parsedForm);
    res.nodeRes.writeHead(303, { Connection: 'close', Location: '/file-upload' });
    res.nodeRes.end();
  }

  protected saveFiles(parsedForm: MulterParsedForm) {
    const promises: Promise<void>[] = [];
    parsedForm.files.forEach((file) => {
      const promise = new Promise<void>((resolve, reject) => {
        const path = `uploaded-files/${file.originalName}`;
        const writableStream = createWriteStream(path);
        file.stream.pipe(writableStream);
        writableStream.on('finish', resolve);
        writableStream.on('error', reject);
      });
      promises.push(promise);
    });

    return Promise.all(promises);
  }
}
