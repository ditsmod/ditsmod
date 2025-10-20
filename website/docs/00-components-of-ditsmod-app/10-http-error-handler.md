---
title: HttpErrorHandler
sidebar_position: 10
---

## CustomError {#customerror}

Ditsmod надає два вбудовані класи - `CustomError` та `HttpErrorHandler` - які можна використовувати, відповідно, для кидання та ловіння помилок.

Клас `CustomError` можна компонувати для створення будь-якої помилки:

```ts {9}
import { CustomError, Status } from '@ditsmod/core';

// ...

if (someCondition) {
  const msg1 = 'message for client';
  const msg2 = 'message for logger';

  throw new CustomError({ msg1, msg2, level: 'debug', status: Status.BAD_REQUEST });
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
  status?: Status = Status.BAD_REQUEST;
  /**
   * The parameters that came with the HTTP request.
   */
  params?: any;
}
```

Конструктор класу `CustomError` другим аргументом може приймати cause error, якщо така є.

## HttpErrorHandler {#httperrorhandler}

Усі помилки, які виникають під час обробки HTTP-запиту, і які ви не зловили у контролерах, інтерсепторах, або сервісах, потрапляють до [DefaultHttpErrorHandler][100]. Цей обробник передається до реєстру DI на рівні роуту.

Ви можете створити свій власний обробник помилок, для цього вам потрібно створити клас, що впроваджує інтерфейс [HttpErrorHandler][101]:

```ts
import { HttpErrorHandler, injectable, isCustomError, Logger, RequestContext, Status } from '@ditsmod/core';
import { randomUUID } from 'node:crypto';

@injectable()
export class MyHttpErrorHandler implements HttpErrorHandler {
  constructor(protected logger: Logger) {}

  async handleError(err: Error, ctx: RequestContext) {
    const requestId = randomUUID();
    const errObj = { requestId, err, note: 'This is my implementation of HttpErrorHandler' };
    if (isCustomError(err)) {
      const { level, status } = err.info;
      this.logger.log(level || 'debug', errObj);
      this.sendError(err.message, ctx, requestId, status);
    } else {
      this.logger.log('error', errObj);
      const msg = err.message || 'Internal server error';
      const status = (err as any).status || Status.INTERNAL_SERVER_ERROR;
      this.sendError(msg, ctx, requestId, status);
    }
  }

  protected sendError(error: string, ctx: RequestContext, requestId: string, status?: Status) {
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
import { rootModule, HttpErrorHandler } from '@ditsmod/core';
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
  resolvedCollisionsPerRou: [
    [HttpErrorHandler, ErrorHandlerModule],
  ],
})
export class SomeModule {}
```

Як бачите, колізія вирішується в масиві `resolvedCollisionsPerRou`, оскільки вона відбувається на рівні роуту. Туди передаєте масив з двох елементів, де на першому місці йде токен, з яким відбулась колізія, а на другому місці - модуль, з якого ви хочете експортувати даний провайдер.

Нагадаємо, що колізії провайдерів можуть виникати виключно під час імпорту модулів. Тобто якщо ви локально у межах конкретного модуля створите власний обробник помилок, то колізій не буде.







[1]: /developer-guides/providers-collisions

[100]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/src/error/default-http-error-handler.ts
[101]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/src/error/http-error-handler.ts
[102]: https://github.com/ditsmod/ditsmod/blob/main/packages/core/src/error/error-opts.ts
