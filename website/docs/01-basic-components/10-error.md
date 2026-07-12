---
title: Error
sidebar_position: 10
---

## CustomError {#customerror}

Ditsmod надає два вбудовані класи - `CustomError` та `HttpErrorHandler` - які можна використовувати, відповідно, для кидання та ловіння помилок.

Клас `CustomError` можна компонувати для створення будь-якої помилки:

```ts {10}
import { HttpStatus } from '@ditsmod/core';
import { CustomError } from '@ditsmod/core/errors';

// ...

if (someCondition) {
  const msg1 = 'message for client';
  const msg2 = 'message for logger';

  throw new CustomError({ msg1, msg2, level: 'debug', status: HttpStatus.BAD_REQUEST });
}
```

Тобто, в аргументах `CustomError` передбачена можливість передачі повідомлень двох типів:
- `msg1` - повідомлення для передачі клієнту, який створив поточний HTTP-запит;
- `msg2` - повідомлення для логера.

Загалом, конструктор класу `CustomError` першим аргументом приймає об'єкт, що має наступний інтерфейс:

```ts
interface ErrorInfo {
  id?: string | number;
  /**
   * Message to send it to a client.
   */
  msg1?: string = 'Internal server error';
  /**
   * A message to send it to a logger.
   */
  msg2?: string = '';
  /**
   * Arguments for error handler to send it to a client.
   */
  args1?: any;
  /**
   * Arguments for error handler to send it to a logger.
   */
  args2?: any;
  /**
   * Log level. By default - `warn`.
   */
  level?: InputLogLevel = 'warn';
  /**
   * HTTP status.
   */
  status?: HttpStatus = HttpStatus.BAD_REQUEST;
  /**
   * The parameters that came with the HTTP request.
   */
  params?: any;
  name?: string;
  code?: string;
}
```

Конструктор класу `CustomError` другим аргументом може приймати cause error, якщо така є.

### Дочірні класи CustomError {#customerror-subclasses}

Рекомендується використовувати `CustomError` у якості базового класу, на основі якого створювати будь-які інші класи помилок. Наприклад таким чином створюється нова помилка `NormalizationFailure` (префікс `DM_ERR_` до `code` цієї помилки додається автоматично):

```ts
import { CustomError } from '@ditsmod/core/errors';
/**
 * `Normalization of ${moduleName} failed`
 */
export class NormalizationFailure extends CustomError {
  constructor(moduleName: string, cause: Error) {
    super(
      {
        msg1: `Normalization of ${moduleName} failed`,
        level: 'fatal',
      },
      cause,
    );
  }
}
```

Це дасть вам змогу контролювати унікальність назв помилок, відлагоджувати помилки через `instanceof`, додавати ланцюжок помилок через поле `cause` (другим аргументом в конструктор `CustomError`), автоматично прибирати частину з стек-трейсу помилки.

## HttpErrorHandler {#httperrorhandler}

Усі помилки, які виникають під час обробки HTTP-запиту, і які ви не зловили у контролерах, інтерсепторах, або сервісах, потрапляють до [DefaultHttpErrorHandler][100]. Цей обробник передається до реєстру DI на рівні роуту.

Ви можете створити свій власний обробник помилок, для цього вам потрібно створити клас, що впроваджує інтерфейс [HttpErrorHandler][101]:

```ts
import { injectable, Logger, HttpStatus } from '@ditsmod/core';
import { HttpErrorHandler, RequestContext } from '@ditsmod/rest';
import { isCustomError } from '@ditsmod/core/errors';

@injectable()
export class MyHttpErrorHandler implements HttpErrorHandler {
  constructor(protected logger: Logger) {}

  async handleError(err: Error, ctx: RequestContext) {
    const requestId = ctx.requestId;
    const errObj = { requestId, err, note: 'This is my implementation of HttpErrorHandler' };
    if (isCustomError(err)) {
      const { level, status } = err.info;
      this.logger.log(level || 'debug', errObj);
      this.sendError(err.message, ctx, requestId, status);
    } else {
      this.logger.log('error', errObj);
      const msg = err.message || 'Internal server error';
      const status = (err as any).status || HttpStatus.INTERNAL_SERVER_ERROR;
      this.sendError(msg, ctx, requestId, status);
    }
  }

  protected sendError(error: string, ctx: RequestContext, requestId: string, status?: HttpStatus) {
    if (!ctx.rawRes.headersSent) {
      this.addRequestIdToHeader(requestId, ctx);
      ctx.sendJson({ error }, status);
    }
  }

  protected addRequestIdToHeader(requestId: string, ctx: RequestContext) {
    ctx.rawRes.setHeader('x-requestId', requestId);
  }
}
```

Щоб централізовано додати ваш новий обробник помилок, можете це зробити прямо у кореневому модулі:

```ts {6-7}
import { rootModule } from '@ditsmod/core';
import { HttpErrorHandler } from '@ditsmod/rest';
import { MyHttpErrorHandler } from './my-http-error-handler.js';

@rootModule({
  // ...
  providersPerRou: [{ token: HttpErrorHandler, useClass: MyHttpErrorHandler }],
  exports: [HttpErrorHandler],
})
export class AppModule {}
```

Звичайно ж, якщо є специфіка обробки помилок для окремо-взятого модуля, чи контролера, ви точно так само можете додати ваш новий обробник тільки у їхні метадані, без впливу на інші компоненти вашого застосунку.

Якщо ви додаєте такий обробник у метадані некореневого модуля, то навряд чи вам треба його експортувати. З іншого боку, якщо ви захочете написати спеціальний модуль для обробки помилок і захочете все-таки експортувати з нього `HttpErrorHandler`, то майте на увазі, що імпорт його у будь-який модуль вимагатиме вирішення [колізії провайдерів][1]. Ця особливість виникає через те, що дефолтний обробник помилок вже додано у кожен модуль вашого застосунку, і при імпортуванні модуля, зі своїм новим обробником помилок, виникає колізія двох обробників помилок. Її можна вирішити досить просто:

```ts {8}
import { restModule, HttpErrorHandler } from '@ditsmod/rest';
import { ErrorHandlerModule } from './error-handler.module.js';

@restModule({
  // ...
  imports: [ErrorHandlerModule],
  resolvedCollisionPerRou: [
    [HttpErrorHandler, ErrorHandlerModule],
  ],
})
export class SomeModule {}
```

Як бачите, колізія вирішується в масиві `resolvedCollisionPerRou`, оскільки вона відбувається на рівні роуту. Туди передаєте масив з двох елементів, де на першому місці йде токен, з яким відбулась колізія, а на другому місці - модуль, з якого ви хочете експортувати даний провайдер.

Нагадаємо, що колізії провайдерів можуть виникати виключно під час імпорту модулів. Тобто якщо ви локально у межах конкретного модуля створите власний обробник помилок, то колізій не буде.







[1]: /basic-components/modules/#provider-collisions

[100]: https://github.com/ditsmod/ditsmod/blob/3.0.0-next.8/packages/rest/src/services/default-http-error-handler.ts
[101]: https://github.com/ditsmod/ditsmod/blob/3.0.0-next.8/packages/rest/src/services/http-error-handler.ts
