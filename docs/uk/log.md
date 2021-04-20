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
