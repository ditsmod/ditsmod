---
sidebar_position: 10
---

# HttpErrorHandler

Усі помилки, які виникають під час обробки HTTP-запиту, і які ви не зловили у контролерах, інтерсепторах, або сервісах, потрапляють до [DefaultHttpErrorHandler][100]. Цей обробник передається до реєстру DI на рівні запиту, оскільки він повинен мати доступ до об'єкта HTTP-запиту/відповіді для можливості відправки відповіді клієнту.

Ви можете створити свій власний обробник помилок, для цього вам потрібно створити клас, що впроваджує інтерфейс [HttpErrorHandler][101]:

```ts
import { Logger, Status, HttpErrorHandler, injectable, Req, RequestContext, cleanErrorTrace } from '@ditsmod/core';

@injectable()
export class MyHttpErrorHandler implements HttpErrorHandler {
  constructor(
    protected req: Req,
    private logger: Logger,
  ) {}

  handleError(err: Error, ctx: RequestContext) {
    cleanErrorTrace(err);
    const message = err.message;
    this.logger.log('error', { note: 'This is my implementation of HttpErrorHandler', err });
    if (!ctx.nodeRes.headersSent) {
      const error = { error: { message } };
      const headers = { 'x-requestId': this.req.requestId };
      ctx.sendJson(error, Status.INTERNAL_SERVER_ERROR, headers);
    }
  }
}
```

Щоб централізовано додати ваш новий обробник помилок, можете це зробити прямо у кореневому модулі:

```ts
import { rootModule, HttpErrorHandler } from '@ditsmod/core';
import { MyHttpErrorHandler } from './my-http-error-handler.js';

@rootModule({
  // ...
  providersPerReq: [{ token: HttpErrorHandler, useClass: MyHttpErrorHandler }],
  exports: [HttpErrorHandler],
})
export class AppModule {}
```

Звичайно ж, якщо є специфіка обробки помилок для окремо-взятого модуля, чи контролера, ви точно так само можете додати ваш новий обробник тільки у їхні метадані, без впливу на інші компоненти вашого застосунку.

Якщо ви додаєте такий обробник у метадані некореневого модуля, то навряд чи вам треба його експортувати. З іншого боку, якщо ви захочете написати спеціальний модуль для обробки помилок і захочете все-таки експортувати з нього `HttpErrorHandler`, то майте на увазі, що імпорт його у будь-який модуль вимагатиме вирішення [колізії провайдерів][1]. Ця особливість виникає через те, що дефолтний обробник помилок вже додано у будь-який модуль вашого застосунку, і при імпортуванні модуля, зі своїм новим обробником помилок, виникає колізія двох обробників помилок. Її можна вирішити досить просто:

```ts {8}
import { featureModule, HttpErrorHandler } from '@ditsmod/core';
import { ErrorHandlerModule } from './error-handler.module.js';

@featureModule({
  // ...
  import: [ErrorHandlerModule]
  resolvedCollisionsPerReq: [
    [HttpErrorHandler, ErrorHandlerModule],
  ],
})
export class SomeModule {}
```

Як бачите, колізія вирішується в масиві `resolvedCollisionsPerReq`, оскільки вона відбувається на рівні запиту. Туди передаєте масив з двох елементів, де на першому місці йде токен, з яким відбулась колізія, а на другому місці - модуль, з якого ви хочете експортувати даний провайдер.

Нагадаємо, що колізії провайдерів можуть виникати виключно під час імпорту модулів. Тобто якщо ви локально у межах конкретного модуля створите власний обробник помилок, то колізій не буде.







[1]: /developer-guides/providers-collisions

[100]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/src/error/default-http-error-handler.ts
[101]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/src/error/http-error-handler.ts
