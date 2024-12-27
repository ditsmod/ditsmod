---
sidebar_position: 1
---

# @ditsmod/body-parser

У цьому модулі зроблена інтеграція з [@ts-stack/body-parser][4] та [@ts-stack/multer][5]. По-дефолту, підтримуються наступні формати даних:

1. `application/json`
2. `application/x-www-form-urlencoded`
3. `text/plain`
4. `application/octet-stream`
5. `multipart/form-data`

За перші чотири формати із цього списку відповідає пакет `@ts-stack/body-parser`, за останій - `@ts-stack/multer`, який використовується для завантаження файлів. І оскільки налаштування для завантаження файлів може сильно відрізнятись від роута до роута, відповідно - для завантаження файлів Ditsmod надає сервіс, що спрощує роботу з файлами, замість готових результатів.

Для парсингу перших чотирьох форматів, цей модуль додає інтерсептор до усіх роутів, що мають HTTP-методи вказані у `bodyParserConfig.acceptMethods`, по-дефолту це:

- `POST`
- `PUT`
- `PATCH`

Готовий приклад використання `@ditsmod/body-parser` можете проглянути в [репозиторії Ditsmod][1].

## Встановлення

```bash
npm i @ditsmod/body-parser
```

## Підключення

Щоб глобально підключити `@ditsmod/body-parser`, потрібно імпортувати та експортувати `BodyParserModule` в кореневому модулі:

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

В такому разі будуть працювати дефолтні налаштування. Якщо ж вам потрібно змінити деякі опції, можете це зробити наступним чином:

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

Ще один варіант передачі конфігурації:

```ts {6,9-11}
import { rootModule, Providers } from '@ditsmod/core';
import { BodyParserModule, BodyParserConfig } from '@ditsmod/body-parser';

@rootModule({
  imports: [
    BodyParserModule,
    // ...
  ],
  providersPerApp: new Providers()
    .useValue<BodyParserConfig>(BodyParserConfig,  { acceptMethods: ['POST'] }),
  exports: [BodyParserModule]
})
export class AppModule {}
```

## Отримання тіла запиту

В залежності від того, чи є контролер [одинаком][3] чи ні, результат роботи інтерсептора можна отримати двома способами:

1. Якщо контролер не є одинаком, результат можна отримати за допомогою токена `HTTP_BODY`:

  ```ts {12}
  import { controller, Res, inject } from '@ditsmod/core';
  import { route } from '@ditsmod/routing';
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
2. Якщо контролер є одинаком, результат можна отримати з контексту:

  ```ts {7}
  import { controller, SingletonRequestContext } from '@ditsmod/core';
  import { route } from '@ditsmod/routing';

  @controller({ scope: 'ctx' })
  export class SomeController {
    @route('POST')
    ok(ctx: SingletonRequestContext) {
      ctx.sendJson(ctx.body);
    }
  }
  ```

## Вимкнення парсера тіла запиту

Звичайно ж, перше, що можна зробити щоб перестав працювати парсер тіла запиту, це  - не імпортувати у ваш модуль `@ditsmod/body-parser` глобально чи локально. Також ви можете вимкнути парсер для конкретного контролера наступним чином:

```ts {6}
import { controller } from '@ditsmod/core';
import { BodyParserConfig } from '@ditsmod/body-parser';

@controller({
  providersPerRou: [
    { token: BodyParserConfig, useValue: { acceptMethods: [] } }
  ],
})
export class SomeController {
  // ...
}
```

Тобто, таким чином ви передаєте пустий масив, замість дефолтного масиву `['POST', 'PUT', 'PATCH']`.

## Завантаження файлів

В залежності від того, чи є контролер [одинаком][3] чи ні, спосіб отримання парсера, та сигнатури його методів трохи відрізняються:

1. Якщо контролер не є одинаком, через DI необхідно запитати `MulterParser`, після чого можете користуватись його методами:

  ```ts {10}
  import { createWriteStream } from 'node:fs';
  import { controller, Res } from '@ditsmod/core';
  import { route } from '@ditsmod/routing';
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
2. Якщо контролер є одинаком, через DI необхідно запитати `MulterSingletonParser`, після чого можете користуватись його методами:

  ```ts {8,12}
  import { createWriteStream } from 'node:fs';
  import { controller, SingletonRequestContext } from '@ditsmod/core';
  import { route } from '@ditsmod/routing';
  import { MulterParsedForm, MulterSingletonParser } from '@ditsmod/body-parser';

  @controller({ scope: 'ctx' })
  export class SomeController {
    constructor(protected parse: MulterSingletonParser) {}

    @route('POST', 'file-upload')
    async downloadFile(ctx: SingletonRequestContext) {
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

Об'єкт `parsedForm`, який повертають методи парсерів, матиме чотири властивості:

1. `textFields` міститиме об'єкт зі значеннями з текстових полів HTML-форми (якщо такі є);
2. `file` міститиме об'єкт, де зокрема зберігатиметься файл у вигляді `Readable` потоку, який можна використовувати для збереження файлу.
3. `files` міститиме масив об'єктів, кожен елемент якого має тип, указаний в другому пункті.
4. `groups` міститиме об'єкт, де кожен ключ відповідає назві поля у HTML-формі, а вміст кожної властивості - це масив файлів, що має тип, указаний у третьому пункті.

За один парсинг може бути заповнено максимум дві властивості із чотирьох - це властивість `textFields` і одна із властивостей: `file`, `files` або `groups`. Яка із властивостей буде заповнюватись, залежить від використаного методу парсера. 

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

### MulterExtendedOptions

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

```ts {4,12}
import { featureModule } from '@ditsmod/core';
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
[3]: /components-of-ditsmod-app/controllers-and-services/#що-являє-собою-контролер
[4]: https://github.com/ts-stack/body-parser/
[5]: https://github.com/ts-stack/multer
[6]: https://github.com/expressjs/body-parser
[7]: https://github.com/expressjs/multer/tree/v2.0.0-rc.4
