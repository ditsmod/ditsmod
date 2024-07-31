import { createWriteStream } from 'node:fs';
import { MulterParsedForm } from '@ditsmod/body-parser';
import { NodeResponse } from '@ditsmod/core';

export function saveFiles(parsedForm: MulterParsedForm) {
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

export function sendHtmlForm(nodeRes: NodeResponse) {
  nodeRes.setHeader('Content-Type', 'text/html');
  nodeRes.end(`
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
