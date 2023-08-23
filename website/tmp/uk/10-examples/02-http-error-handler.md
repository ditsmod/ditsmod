# 02-http-error-handler

Щоб спробувати даний приклад, необхідно спочатку [підготувати передумови](./prerequisite).

Ditsmod в ядрі передає клас `HttpErrorHandler` до інжектора на рівні HTTP-запиту та використовує DI щоб отримати інстанс цього класу для обробки помилок, що виникають під час роботи контролерів. Початково, цей клас підміняється класом `DefaultHttpErrorHandler`, що робить мінімальну обробку помилок:

```ts
@injectable()
export class DefaultHttpErrorHandler implements HttpErrorHandler {
  constructor(private res: Res, private log: Log) {}

  handleError(err: Error) {
    const { message } = err;
    this.log.controllerHasError('error', [err]);
    if (!this.res.nodeRes.headersSent) {
      this.res.sendJson({ error: { message } }, Status.INTERNAL_SERVER_ERROR);
    }
  }
}
```

У прикладі `02-http-error-handler` показано варіант підміни цього класу за допомогою класу `MyHttpErrorHandler`. Зверніть увагу, що `HttpErrorHandler` спочатку передається в кореневому модулі в масиві `providersPerReq`, а потім експортується з підміною його на `MyHttpErrorHandler`.

Коли ви експортуєте певний провайдер з кореневого модуля, тим самим ви додаєте його у кожен модуль застосунку.

Запустіть застосунок з першого терміналу:

```bash
npm start
```

З другого терміналу перевірте роботу:

```bash
curl -isS localhost:3000
curl -isS localhost:3000/throw-error
```
