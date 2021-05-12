# Додаткова інфа

## Автопарсинг тіла запиту

Якщо ви експортували `BodyParserModule` із кореневого модуля, Ditsmod на етапі ініціалізації
застосунку проглядає який HTTP-метод указується в декораторі `Route` для певного маршрута, щоб
визначити чи потрібно парсити тіло запиту в майбутньому. Перелік HTTP-методів, для яких потрібно
парсити тіло запиту, указано в класі `BodyParserConfig` у властивості `acceptMethods`:

```ts
export class BodyParserConfig {
  acceptMethods: HttpMethod[] = ['POST', 'PUT', 'PATCH'];
  acceptHeaders: string[] = [
    'application/json',
    'application/x-www-form-urlencoded',
    'text/plain',
    'text/html',
  ];
  maxBodySize: number = 1024 * 1024 * 5; // 5 MB
  multipartOpts: MultipartBodyParserOptions = {};
}
```

Оскільки цей клас Ditsmod отримує від DI, ви можете змінити дані налаштування підмінивши
`BodyParserConfig` вашим власним класом:

```ts
import { Module, BodyParserConfig } from '@ditsmod/core';

import { MyBodyParserConfig } from './my-body-parser-config';

@Module({
  providersPerMod: [{ provide: BodyParserConfig, useClass: MyBodyParserConfig }],
})
export class SomeModule {}
```

Враховуючи те, що `BodyParserConfig` у ядрі Ditsmod оголошено на рівні застосунку, ви можете
[понизити цей рівень][127] до рівня модуля, чи запиту. Якраз це і відбувається в даному
прикладі, бо тут `BodyParserConfig` оголошується вже на рівні модуля. Це означає, що внесені
вами зміни будуть діяти в межах `SomeModule`.

## Сервіс Log

Даний сервіс використовується у якості посередника між `@ditsmod/core` та логером, він
дає можливість переписувати будь-яке повідомлення, що створено в ядрі Ditsmod.

Для цього достатньо розширити клас `Log` та підмінити його через DI:

```ts
import { HelloWorldController } from './hello-world.controller';

class MyLog extends Log {
  /**
   * `serverName` is running at `host`:`port`.
   */
  serverListen(level: keyof Logger, args: any[] = []) {
    this._logger.log(level, `Here serverName: "${args[0]}", here host: "${args[1]}", and here port: "${args[2]}"`);
  }
}

@RootModule({
  controllers: [HelloWorldController],
  providersPerApp: [
    { provide: Router, useClass: DefaultRouter },
    { provide: Log, useClass: MyLog }, // Here set your new MyLog
  ],
})
export class AppModule {}
```

Окрім цього, використання даного сервісу дозволяє уникати прописування статичного тексту в різних
частинах коду, натомісць в коді можна прописувати назви методів класу `Log`:

```ts
this.log.serverListen('info', [this.meta.serverName, host, this.meta.listenOptions.port]);
// чи
this.log.youForgotRegisterExtension('warn', [moduleName, p.provide, p.useClass.name]);
// і т.д.
```

Кожен метод першим параметром приймає рівень логування: `trace`, `debug`, `info`, `warn`, `error`
або `fatal`. Другим параметром йде масив, куди можна передавати дані для динамічних повідомлень.

## AppInitializer

Цей сервіс використовує метадані, зібрані за допомогою сервісу `ModuleManager`, його
призначено для:

- встановлення by default провайдерів та злиття їх із глобальними провайдерами, указаними у метаданих
модулів;
- перевірки на колізії глобальних провайдерів;
- створення інжектора на рівні застосунку;
- створення інстансів `Logger` та `PreRouter`;
- перевірки можливості вирішення залежностей для класів з декоратором `@Module`;
- створення інстансу `ModuleFactory` та запуску процесу формування модулів Ditsmod;
- створення інстансів розширень Ditsmod та запуск їхньої ініціалізації.

## ModuleFactory

Цей сервіс використовує метадані, зібрані за допомогою сервісу `ModuleManager`, його
призначено для:

- імпорту та експорту глобальних провайдерів з кожного модуля;
- об'єднання глобальних та локальних провайдерів
- перевірка провайдерів на колізії
- збору метаданих модуля та усіх його контролерів
# ModuleManager

Цей сервіс призначено для:

- сканування та нормалізації метаданих, зібраних із декораторів `@Module` та `@RootModule`;
- зберігання результату сканування;
- додавання або видалення певних модулів із масивів імпорту чи експорту інших модулів.

Після додавання або видалення модулів, якщо ви намагаєтесь заново сканувати кореневий модуль,
результат буде точно такий же, як наче ви не змінювали кореневий модуль. Таке відбувається
через те, що оригінальні метадані модулів не змінюються.

Приклад динамічного додвавання та видалення модулів див. у [7-dynamically-composing-modules](../../examples/7-dynamically-composing-modules)

[127]: ./dependency-injection#пріоритетність-провайдерів
