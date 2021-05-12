# 02-controller-error-handler

Щоб спробувати даний приклад, необхідно спочатку [підготувати передумови](./prerequisite).

Ditsmod в ядрі оголошує клас `ControllerErrorHandler` на рівні HTTP-запиту та використовує DI щоб
отримати інстанс цього класу для обробки помилок, що виникають під час роботи контролерів.
Початково, цей клас робить мінімальну обробку помилок:

```ts
class ControllerErrorHandler {
  constructor(private res: Response, private log: Logger) {}

  handleError(err: Error) {
    const { message } = err;
    this.log.error({ err });
    if (!this.res.nodeRes.headersSent) {
      this.res.sendJson({ error: { message } }, Status.INTERNAL_SERVER_ERROR);
    }
  }
}
```

У прикладі `2-controller-error-handler` показано варіант впровадження інтерфейсу
`ControllerErrorHandler` у класі `MyControllerErrorHandler`. Зверніть увагу,
що `ControllerErrorHandler` спочатку оголошується в кореневому модулі в масиві `providersPerReq`,
а потім експортується з підміною його на `MyControllerErrorHandler`.

Коли ви експортуєте певний провайдер з кореневого модуля, тим самим ви збільшуєте область
його видимості для DI на весь застосунок.

Але чому відбувається оголошення саме в масиві `providersPerReq`? - Через те, що в конструкторі
запитується провайдер `Response` на рівні запиту. Якщо б ви оголосили `ControllerErrorHandler`
в масиві `providersPerApp`, DI використовував би [інжектор][101] на рівні застосунку, і саме через це
він би не побачив провайдерів на рівні запиту.

Перевірити роботу прикладу можна так, з першого терміналу:

```bash
yarn start2
```

З другого терміналу:

```bash
curl -isS localhost:8080
curl -isS localhost:8080/throw-error
```

[101]: ../tutorial-basics/dependency-injection#інжектори-di
