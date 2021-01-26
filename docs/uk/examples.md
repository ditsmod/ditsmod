# Приклади застосунків

Тека [examples][1] містить приклади застосування Ditsmod для типових випадків.
Щоб вам було зручніше проглядати приклади, можете клонувати репозиторій Ditsmod
та встановити npm залежності:

```bash
git clone git@github.com:ts-stack/ditsmod.git
cd ditsmod
npm i
```

Після чого можете запустити один із застосунків, експерементувати з ними,
і зразу бачити результат.

Кожен приклад має README.md, де коротко описано основні його особливості.

## 1-hello-world

Самий простий приклад, де є кореневий модуль, один контролер та один маршрут.

Перевірити роботу прикладу можна так, з першого терміналу:

```bash
npm run start1
```

З другого терміналу:

```bash
curl -isS localhost:8080
```

## 2-controller-error-handler

Ditsmod в ядрі оголошує клас `ControllerErrorHandler` на рівні HTTP-запиту та використовує DI щоб
отримати інстанс цього класу для обробки помилок, що виникають під час роботи контролерів.
Початково, цей клас робить мінімальну обробку помилок:

```ts
class ControllerErrorHandler {
  constructor(private res: Response, private log: Logger) {}

  handleError(err: Error) {
    const message = err.message;
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
в масиві `providersPerApp`, DI використовував би [інжектор][2] на рівні застосунку, і саме через це
він би не побачив провайдерів на рівні запиту.

Перевірити роботу прикладу можна так, з першого терміналу:

```bash
npm run start2
```

З другого терміналу:

```bash
curl -isS localhost:8080
curl -isS localhost:8080/throw-error
```

## 3-route-guards

У цьому прикладі, в кореневий модуль імпортується `SomeModule`, де є контролер із захищеними
маршрутами. Захист даних маршрутів відбуваєтья за допомогою [гардів (guards)][4].
Ці гарди знаходяться в `AuthModule`, а сам модуль експортується без імпорту. Еспорт модулів
стосується виключно збільшення області видимості провайдерів для DI. Не має сенсу експортувати
модулі окрім як для збільшення області видимості оголошених в них провайдерів.

Разом із тим, якщо ви робите [експорт певного модуля із кореневого модуля][3], область видимості
провайдерів даного модуля може збільшитись на весь застосунок. Саме це і відбувається з
провайдерами у модулі `AuthModule`.

В `SomeController` показано два варіанти використання гардів. Перший варіант без аргументів:

```ts
@Route('GET', 'unauth', [AuthGuard])
throw401Error() {
  this.res.send('some secret');
}
```

Другий варіант з аргументами:

```ts
@Route('GET', 'forbidden', [[PermissionsGuard, Permission.canActivateAdministration]])
throw403Error() {
  this.res.send('some secret');
}
```

Перевірити роботу прикладу можна так, з першого терміналу:

```bash
npm run start3
```

З другого терміналу:

```bash
curl -isS localhost:8080
curl -isS localhost:8080/unauth
curl -isS localhost:8080/forbidden
```

## 4-logger

У цьому прикладі, `ConfigService` оголошено в масиві `providersPerApp`, саме тому цей провайдер
буде доступний в будь-якому конструкторі застосунку.

Перевірити роботу прикладу можна так, з першого терміналу:

```bash
npm run start4
```

З другого терміналу:

```bash
curl -isS localhost:8080/bunyan
curl -isS localhost:8080/pino
curl -isS localhost:8080/winston
```

[1]: https://github.com/ts-stack/ditsmod/tree/master/examples
[2]: ./README.md#інжектори-di
[3]: ./README.md#експорт-провайдерів-із-кореневого-модуля
[4]: ./README.md#guards
