---
sidebar_position: 3
---

# @ditsmod/body-parser

In this module, integration is done with [@ts-stack/body-parser][4] and [@ts-stack/multer][5]. By default, the following data formats are supported:

1. `application/json`
2. `application/x-www-form-urlencoded`
3. `text/plain`
4. `application/octet-stream`
5. `multipart/form-data`

The first four formats in this list are handled by the `@ts-stack/body-parser` package, while the last one is managed by `@ts-stack/multer`, which is used for file uploads. Since the configuration for file uploads can vary significantly from route to route, Ditsmod provides a service to simplify file handling instead of ready-made value.

For parsing the first four formats, this module adds an interceptor to all routes that have HTTP methods specified in `bodyParserConfig.acceptMethods`, which by default are:

- `POST`
- `PUT`
- `PATCH`

A ready-made example of using `@ditsmod/body-parser` can be viewed in the [Ditsmod repository][1].

## Installation {#installation}

```bash
npm i @ditsmod/body-parser
```

## Importing {#importing}

To enable `@ditsmod/body-parser` globally, you need to import and export `BodyParserModule` in the root module:

```ts
import { restRootModule } from '@ditsmod/rest';
import { BodyParserModule } from '@ditsmod/body-parser';

@restRootModule({
  imports: [
    BodyParserModule,
    // ...
  ],
  exports: [BodyParserModule]
})
export class AppModule {}
```

In this case, the default settings will work. If you need to change some options, you can do it as follows:

```ts {4-8,12,15}
import { restRootModule } from '@ditsmod/rest';
import { BodyParserModule } from '@ditsmod/body-parser';

const moduleWithBodyParserConfig = BodyParserModule.withParams({
  acceptMethods: ['POST'],
  jsonOptions: { limit: '500kb', strict: false },
  urlencodedOptions: { extended: true },
});

@restRootModule({
  imports: [
    moduleWithBodyParserConfig,
    // ...
  ],
  exports: [moduleWithBodyParserConfig],
})
export class AppModule {}
```

Another option for passing the configuration:

```ts {10}
import { restRootModule } from '@ditsmod/rest';
import { BodyParserModule, BodyParserConfig } from '@ditsmod/body-parser';

@restRootModule({
  imports: [
    BodyParserModule,
    // ...
  ],
  providersPerApp: [
    { token: BodyParserConfig, useValue: { acceptMethods: ['POST'] } }
  ],
  exports: [BodyParserModule],
})
export class AppModule {}
```

## Retrieving the request body {#retrieving-the-request-body}

Depending on whether the controller works [in context-scoped or injector-scoped mode][3], the result of the interceptor can be obtained in two ways:

1. If the controller works in injector-scoped mode, the result can be obtained using the `HTTP_BODY` token:

  ```ts {12}
  import { inject } from '@ditsmod/core';
  import { controller, Res, route } from '@ditsmod/rest';
  import { HTTP_BODY } from '@ditsmod/body-parser';

  interface Body {
    one: number;
  }

  @controller()
  export class SomeController {
    @route('POST')
    ok(@inject(HTTP_BODY) body: Body, res: Res) {
      res.sendJson(body);
    }
  }
  ```
2. If the controller is in context-scoped mode, the result can be obtained from the context:

  ```ts {6}
  import { controller, RequestContext, route } from '@ditsmod/rest';

  @controller({ scope: 'ctx' })
  export class SomeController {
    @route('POST')
    ok(ctx: RequestContext) {
      ctx.sendJson(ctx.body);
    }
  }
  ```

## Disabling the Request Body Parser {#disabling-the-request-body-parser}

Of course, the first thing you can do to disable the request body parser is to avoid importing `@ditsmod/body-parser` into your module, either globally or locally. Additionally, you can disable the parser for a specific controller as follows:

```ts {5}
import { controller } from '@ditsmod/rest';
import { BodyParserConfig } from '@ditsmod/body-parser';

@controller({
  providersPerRou: [{ token: BodyParserConfig, useValue: { acceptMethods: [] } }],
})
export class SomeController {
  // ...
}
```

That is, this way you pass an empty array, instead of the default array `['POST', 'PUT', 'PATCH']`.

## File Uploads {#file-uploads}

Depending on whether the controller works [in injector-scope or context-scope mode][3], the method of obtaining the parser and the signatures of its methods differ slightly:

1. If the controller is running in injector-scope mode, `MulterParser` must be requested via DI, after which you can use its methods:

  ```ts {9}
  import { createWriteStream } from 'node:fs';
  import { controller, Res, route } from '@ditsmod/rest';
  import { MulterParsedForm, MulterParser } from '@ditsmod/body-parser';

  @controller()
  export class SomeController {
    @route('POST', 'file-upload')
    async downloadFile(res: Res, parse: MulterParser) {
      const parsedForm = await parse.array('fieldName', 5);
      await this.saveFiles(parsedForm);
      // ...
      res.send('ok');
    }

    protected saveFiles(parsedForm: MulterParsedForm) {
      const promises: Promise<void>[] = [];
      parsedForm.files.forEach((file) => {
        const promise = new Promise<void>((resolve, reject) => {
          const path = `uploaded-files/${file.originalName}`;
          const writableStream = createWriteStream(path).on('error', reject).on('finish', resolve);
          file.stream.pipe(writableStream);
        });
        promises.push(promise);
      });

      return Promise.all(promises);
    }
  }
  ```
2. If the controller works in context-scoped mode, `MulterCtxParser` must be requested via DI, after which you can use its methods:

  ```ts {7,11}
  import { createWriteStream } from 'node:fs';
  import { controller, RequestContext, route } from '@ditsmod/rest';
  import { MulterParsedForm, MulterCtxParser } from '@ditsmod/body-parser';

  @controller({ scope: 'ctx' })
  export class SomeController {
    constructor(protected parse: MulterCtxParser) {}

    @route('POST', 'file-upload')
    async downloadFile(ctx: RequestContext) {
      const parsedForm = await this.parse.array(ctx, 'fieldName', 5);
      await this.saveFiles(parsedForm);
      // ...
      ctx.rawRes.end('ok');
    }

    protected saveFiles(parsedForm: MulterParsedForm) {
      const promises: Promise<void>[] = [];
      parsedForm.files.forEach((file) => {
        const promise = new Promise<void>((resolve, reject) => {
          const path = `uploaded-files/${file.originalName}`;
          const writableStream = createWriteStream(path).on('error', reject).on('finish', resolve);
          file.stream.pipe(writableStream);
        });
        promises.push(promise);
      });

      return Promise.all(promises);
    }
  }
  ```

The `parsedForm` object returned by the parser methods will have four properties:

1. `textFields` will contain an object with values from the HTML form's text fields (if any);
2. `file` will contain an object, which includes the file as a `Readable` stream that can be used to save the file.
3. `files` will contain an array of objects, where each element has the type specified in the second point.
4. `groups` will contain an object where each key corresponds to the name of a field in the HTML form, and the content of each property is an array of files with the type specified in the third point.

A maximum of two properties from these four can be filled in one parsing: the `textFields` property and one of the properties: `file`, `files`, or `groups`. Which property will be filled depends on the parser method used.

- The `single` method accepts a single file from the specified form field; note the property names during object destructuring (other properties will be unfilled in this case):

  ```ts
  const { textFields, file } = await parse.single('fieldName');
  // OR
  const { textFields, file } = await parse.single(ctx, 'fieldName'); // For context-scoped.
  ```

- The `array` method can accept multiple files from the specified form field:
  ```ts
  const { textFields, files } = await parse.array('fieldName', 5);
  // OR
  const { textFields, files } = await parse.array(ctx, 'fieldName', 5); // For context-scoped.
  ```
- The `any` method returns the same type of data as the `array` method, but it accepts files with any form field names and does not have parameters to limit the maximum number of files (this limit is determined by the general configuration, which will be discussed later):

  ```ts
  const { textFields, files } = await parse.any();
  // OR
  const { textFields, files } = await parse.any(ctx); // For context-scoped.
  ```

- The `groups` method accepts arrays of files from specified form fields:
  ```ts
  const { textFields, groups } = await parse.groups([
    { name: 'avatar', maxCount: 1 },
    { name: 'gallery', maxCount: 8 },
  ]);
  // OR
  const { textFields, groups } = await parse.groups(ctx, [
    { name: 'avatar', maxCount: 1 },
    { name: 'gallery', maxCount: 8 },
  ]); // For context-scoped.
  ```
- The `textFields` method returns an object only with form fields that do not have `type="file"`; if there are file fields in the form, this method will throw an error:
  ```ts
  const textFields = await parse.textFields();
  // OR
  const textFields = await parse.textFields(ctx); // For context-scoped.
  ```

### MulterExtendedOptions {#multerextendedoptions}

In modules where `@ditsmod/body-parser` will be used for forms with data in `multipart/form-data` format, you can pass a provider with the token `MulterExtendedOptions` to DI. This class has two more options than the native `MulterOptions` class from `@ts-stack/multer`:

```ts
import { InputLogLevel, Status } from '@ditsmod/core';
import { MulterOptions } from '@ts-stack/multer';

export class MulterExtendedOptions extends MulterOptions {
  errorStatus?: Status = Status.BAD_REQUEST;
  errorLogLevel?: InputLogLevel = 'debug';
}
```

It is recommended to pass the provider with this token at the module level so that it applies to both `MulterParser` and `MulterCtxParser`:

```ts {4,12}
import { restModule } from '@ditsmod/rest';
import { BodyParserModule, MulterExtendedOptions } from '@ditsmod/body-parser';

const multerOptions: MulterExtendedOptions = { limits: { files: 20 }, errorLogLevel: 'debug' };

@restModule({
  imports: [
    // ...
    BodyParserModule
  ],
  providersPerMod: [
    { token: MulterExtendedOptions, useValue: multerOptions }
  ],
})
export class SomeModule {}
```

[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/06-body-parser
[2]: https://www.npmjs.com/package/@ts-stack/multiparty
[3]: /components-of-ditsmod-app/controllers-and-services/#what-is-a-controller
[4]: https://github.com/ts-stack/body-parser/
[5]: https://github.com/ts-stack/multer
[6]: https://github.com/expressjs/body-parser
[7]: https://github.com/expressjs/multer/tree/v2.0.0-rc.4
