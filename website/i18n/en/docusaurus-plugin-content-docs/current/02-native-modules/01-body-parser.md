---
sidebar_position: 1
---

# @ditsmod/body-parser

In this module, integration is done with [@ts-stack/body-parser][4] (which is a fork of the well-known [ExpressJS package][6]) and [@ts-stack/multer][5] (which is also a fork of the well-known [ExpressJS package][7]). By default, the following data formats are supported:

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

## Installation

```bash
npm i @ditsmod/body-parser
```

## Importing

To enable `@ditsmod/body-parser` globally, you need to import and export `BodyParserModule` in the root module:

```ts
import { rootModule } from '@ditsmod/core';
import { BodyParserModule } from '@ditsmod/body-parser';

@rootModule({
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
import { rootModule } from '@ditsmod/core';
import { BodyParserModule } from '@ditsmod/body-parser';

const moduleWithBodyParserConfig = BodyParserModule.withParams({
  acceptMethods: ['POST'],
  jsonOptions: { limit: '500kb', strict: false },
  urlencodedOptions: { extended: true },
});

@rootModule({
  imports: [
    moduleWithBodyParserConfig,
    // ...
  ],
  exports: [moduleWithBodyParserConfig],
})
export class AppModule {}
```

Another option for passing the configuration:

```ts {6,10-11,13}
import { rootModule, Providers } from '@ditsmod/core';
import { BodyParserModule, BodyParserConfig } from '@ditsmod/body-parser';

@rootModule({
  imports: [
    BodyParserModule,
    // ...
  ],
  providersPerApp: [
    ...new Providers()
      .useValue<BodyParserConfig>(BodyParserConfig,  { acceptMethods: ['POST'] })
  ],
  exports: [BodyParserModule]
})
export class AppModule {}
```

## Retrieving the request body

Depending on whether the controller is [singleton][3] or not, the result of the interceptor can be obtained in two ways:

1. If the controller is non-singleton, the result can be obtained using the `HTTP_BODY` token:

  ```ts {11}
  import { controller, Res, route, inject } from '@ditsmod/core';
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
2. If the controller is singleton, the result can be obtained from the context:

  ```ts {6}
  import { controller, route, SingletonRequestContext } from '@ditsmod/core';

  @controller({ isSingleton: true })
  export class SomeController {
    @route('POST')
    ok(ctx: SingletonRequestContext) {
      ctx.sendJson(ctx.body);
    }
  }
  ```

## Завантаження файлів

В залежності від того, чи є контролер [одинаком][3] чи ні, спосіб отримання парсера, та сигнатури його методів трохи відрізняються:

1. Якщо контролер не є одинаком, через DI необхідно запитати `MulterParser`, після чого можете користуватись його методами:

  ```ts {9}
  import { createWriteStream } from 'node:fs';
  import { controller, Res, route } from '@ditsmod/core';
  import { MulterParsedForm, MulterParser } from '@ditsmod/body-parser';

  @controller()
  export class SomeController {
    @route('POST', 'file-upload')
    async downloadFile(res: Res, parse: MulterParser) {
      const parsedForm = await parse.array('files', 5);
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
2. Якщо контролер є одинаком, через DI необхідно запитати `MulterSingletonParser`, після чого можете користуватись його методами:

  ```ts {11}
  import { createWriteStream } from 'node:fs';
  import { controller, route, SingletonRequestContext } from '@ditsmod/core';
  import { MulterParsedForm, MulterSingletonParser } from '@ditsmod/body-parser';

  @controller({ isSingleton: true })
  export class SomeController {
    constructor(protected parse: MulterSingletonParser) {}

    @route('POST', 'file-upload')
    async downloadFile(ctx: SingletonRequestContext) {
      const parsedForm = await this.parse.array(ctx, 'files', 5);
      await this.saveFiles(parsedForm);
      // ...
      ctx.nodeRes.end('ok');
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

Об'єкт `parsedForm`, який повертають методи парсерів, матиме чотири властивості:

1. `textFields` міститиме об'єкт зі значеннями з текстових полів HTML-форми (якщо такі є);
2. `file` міститиме об'єкт, де зокрема зберігатиметься файл у вигляді `Readable` потоку, який можна використовувати для збереження файлу.
3. `files` міститиме масив об'єктів, кожен елемент якого має тип, указаний в другому пункті.
4. `groups` міститиме об'єкт, де кожен ключ відповідає назві поля у HTML-формі, а вміст кожної властивості - це масив файлів, що має тип, указаний у третьому пункті.

За один парсинг може бути заповнено максимум дві властивості із чотирьох - це поле `textFields` і одна із властивостей: `file`, `files` або `groups`. Яка із властивостей буде заповнюватись, залежить від використаного методу парсера. 

- метод `single` приймає єдиний файл з указаного поля форми; зверніть увагу на назви властивостей під час деструкції об'єкта (інші властивості, в даному випадку, є незаповненими):
  ```ts
  const { textFields, file } = await parse.single('fieldName');
  // OR
  const { textFields, file } = await parse.single(ctx, 'fieldName'); // For singleton.
  ```

- метод `array` може приймати декілька файлів з указаного поля форми:
  ```ts
  const { textFields, files } = await parse.array('fieldName', 5);
  // OR
  const { textFields, files } = await parse.array(ctx, 'fieldName', 5); // For singleton.
  ```
- метод `any` повертає такий самий тип даних, що і метод `array`, але він приймає файли з будь-якими назвами полів форми, а також він не має параметрів для обмеження максимальної кількості файлів (вона обмежується лише загальною конфігурацією, про яку буде йти мова згодом):
  ```ts
  const { textFields, files } = await parse.any();
  // OR
  const { textFields, files } = await parse.any(ctx); // For singleton.
  ```

- метод `groups` приймає масиви файлів з указаними полями форми:
  ```ts
  const { textFields, groups } = await parse.groups([
    { name: 'avatar', maxCount: 1 },
    { name: 'gallery', maxCount: 8 },
  ]);
  // OR
  const { textFields, groups } = await parse.groups(ctx, [
    { name: 'avatar', maxCount: 1 },
    { name: 'gallery', maxCount: 8 },
  ]); // For singleton.
  ```
- метод `textFields` повертає об'єкт лише з полів форми, що не мають `type="file"`; якщо у формі будуть поля з файлами, цей метод кине помилку:
  ```ts
  const textFields = await parse.textFields();
  // OR
  const textFields = await parse.textFields(ctx); // For singleton.
  ```

### MulterOptions

У модулях, де буде працювати `@ditsmod/body-parser` для форм з даними у форматі `multipart/form-data`, можете передавати до DI провайдер з токеном `MulterExtendedOptions`. Цей клас має на дві опції більше, ніж рідний для `@ts-stack/multer` клас `MulterOptions`:

```ts
import { InputLogLevel, Status } from '@ditsmod/core';
import { MulterOptions } from '@ts-stack/multer';

export class MulterExtendedOptions extends MulterOptions {
  errorStatus?: Status = Status.BAD_REQUEST;
  errorLogLevel?: InputLogLevel = 'debug';
}
```

Рекомендуємо передавати провайдер з цим токеном на рівні модуля, щоб він діяв як для `MulterParser` так і для `MulterSingletonParser`:

```ts {5,13-14}
import { featureModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';
import { BodyParserModule, MulterExtendedOptions } from '@ditsmod/body-parser';

const multerOptions: MulterExtendedOptions = { limits: { files: 20 }, errorLogLevel: 'debug' };

@featureModule({
  imports: [
    // ...
    BodyParserModule
  ],
  providersPerMod: [
    { token: MulterExtendedOptions, useValue: multerOptions },
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
