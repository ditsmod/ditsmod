## Prerequisites

If you haven't prepared the examples repository yet, you can do so:

```bash
git clone https://github.com/ditsmod/ditsmod.git
cd ditsmod
npm i
```

## Body parser

Start from first terminal:

```bash
cd examples/06*
npm run start:dev
```

From second terminal, send JSON as POST method:

```bash
curl -i localhost:3000 -d '{"one":1}' -H 'content-type: application/json'
```

To try uploading files via the HTML form, go to [http://0.0.0.0:3000/file-upload](http://0.0.0.0:3000/file-upload) in your browser. If the upload was successful, you should see the corresponding files in the `examples/06-body-parser/uploaded-files` folder.

Fore more info see [@ditsmod/body-parser](https://ditsmod.github.io/en/rest-application/rest-application/native-modules/body-parser/).
