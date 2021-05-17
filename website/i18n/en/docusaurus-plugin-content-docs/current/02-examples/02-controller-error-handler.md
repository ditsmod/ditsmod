# 02-controller-error-handler

Щоб спробувати даний приклад, необхідно спочатку [підготувати передумови](./prerequisite).

Ditsmod в ядрі оголошує клас `ControllerErrorHandler` на рівні HTTP-запиту та використовує DI щоб
отримати інстанс цього класу для обробки помилок, що виникають під час роботи контролерів.
Початково, цей клас підміняється класом `DefaultControllerErrorHandler`, що робить мінімальну
обробку помилок:

```ts
@Injectable()
export class DefaultControllerErrorHandler implements ControllerErrorHandler {
  constructor(private res: Response, private log: Log) {}

  handleError(err: Error) {
    const { message } = err;
    this.log.controllerHasError('error', [err]);
    if (!this.res.nodeRes.headersSent) {
      this.res.sendJson({ error: { message } }, Status.INTERNAL_SERVER_ERROR);
    }
  }
}
```

У прикладі `02-controller-error-handler` показано варіант підміни цього класу за допомогою класу
`MyControllerErrorHandler`. Зверніть увагу, що `ControllerErrorHandler` спочатку оголошується в
кореневому модулі в масиві `providersPerReq`, а потім експортується з підміною його на
`MyControllerErrorHandler`.

Коли ви експортуєте певний провайдер з кореневого модуля, тим самим ви збільшуєте область
його видимості для DI на весь застосунок.

Запустіть застосунок з першого терміналу:

```bash
yarn start2
```

З другого терміналу перевірте роботу:

```bash
curl -isS localhost:8080
curl -isS localhost:8080/throw-error
```

[101]: ../core/dependency-injection#інжектори-di
