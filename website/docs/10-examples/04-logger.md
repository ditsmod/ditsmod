# 04-logger

Щоб спробувати даний приклад, необхідно спочатку [підготувати передумови](./prerequisite).

У цьому прикладі показано:
- як можна в одному застосунку мати одночасно декілька різних логерів;
- як налаштовувати кожен із логерів для сумісності з Ditsmod;
- як встановлювати різні рівні виводу інформації взагалі для застосунку, чи окремо для модуля.

Продемонстровано роботу з чотирма наступними логерами:

- `ConsoleLogger` - це by default логер, який можна використовувати для розробки застосунку;
- [bunyan][6];
- [pino][7];
- [winston][5].

На практиці навряд чи може знадобитись більше одного логера, але в цьому прикладі корисно буде глянути на роботу ієрархічної архітектури DI, правила експорту/імпорту провайдерів, механізм підміни by default логера та by default конфігурації для логера.

Можете запустити застосунок з першого терміналу:

```bash
yarn start4
```

З другого терміналу перевірити роботу:

```bash
curl -isS localhost:3000
curl -isS localhost:3000/pino
curl -isS localhost:3000/winston
curl -isS localhost:3000/bunyan
```

## SomeModule

Найпростіше налаштувати by default логер, що працює у `SomeController`:

```ts
import { Logger } from '@ditsmod/core';
// ...
  constructor(private logger: Logger) {}
// ...
}
```

Використовуючи у конструкторі `Logger`, у DI по-суті запитується by default логер, оскільки у `SomeModule` немає підміни на інший логер. Разом з тим, у `SomeModule` є підміна `LoggerConfig` та змінено рівень виводу інформації:

```ts
import { LoggerConfig, Providers } from '@ditsmod/core';

// ...
  providersPerMod: [
    ...new Providers().useLogConfig({ level: 'trace' })
  ],
// ...
```

Через це, усі логери у межах `SomeModule` будуть виводити інформацію на рівні `trace`.

## BunyanModule

Щоб запитати [bunyan][6] у контролері, використовується by default клас, що імпортується з `bunyan`:

```ts
import BunyanLogger from 'bunyan';
// ...
  constructor(private logger: BunyanLogger) {}
// ...
```

Зверніть увагу, що `BunyanLogger` це саме **клас**, а не інтерфейс чи анонімна функція, бо з інтерфейсом чи анонімною функцією DI не працював би. Але щоб DI видавав відповідний логер по токену `BunyanLogger`, у модулі можна зробити наступні налаштування:

```ts
import { createLogger } from 'bunyan';

const logger = createLogger({ name: 'bunyan-test' });
  // ...
  providersPerMod: [
    { provide: Logger, useValue: logger },
    { provide: BunyanLogger, useExisting: Logger }
  ],
  // ...
```

По-суті, об'єкт з властивістю `useExisting` говорить: "Коли у DI запитується провайдер по токену `BunyanLogger`, потрібно шукати відповідне значення по токену `Logger`". Тобто, фактично другий елемент масиву посилається на перший елемент масиву.

Більш докладно про `useExisting` можна почитати у [документації @ts-stack/di][8].

Йдемо далі. На цьому етапі налаштування, у будь-якому контролері в межах `BunyanModule` інстанс `bunyan` може видаватись як по токену `Logger`, так і по токену `BunyanLogger`. До речі, можна було б зробити простіше, можна було замість двох інструкцій для DI, передати одну інструкцію:

```ts
import { createLogger } from 'bunyan';

const logger = createLogger({ name: 'bunyan-test' });
  // ...
  providersPerMod: [
    { provide: BunyanLogger, useValue: logger },
  ],
  // ...
```

В такому разі, в межах `BunyanModule` по токену `Logger` DI видавав би `ConsoleLogger`, а по токену `BunyanLogger` - видавав би нативний інстанс `bunyan`. Це трохи гірший варіант, оскільки Ditsmod під капотом використовує токен `Logger` для роботи з логером, тому усі системні логи будуть писатись за допомогою `ConsoleLogger`, що у більшості випадків підходить тільки для розробки, а не для продуктового режиму.

Повертаємось до нашого попереднього (правильного) налаштування, коли інстанс `bunyan` може видаватись як по токену `Logger`, так і по токену `BunyanLogger`. Тепер нам залишилось зробити сумісність інстансу `bunyan` з інтерфейсом класу `Logger`, тобто до інстансу `bunyan` потрібно додати методи `log()`, `getLevel()` та `setLevel()`. Це краще зробити в окремій функції `patchLogger()`, яку потім можна буде передати до DI:

```ts
import { Logger, LoggerConfig, Module } from '@ditsmod/core';
import BunyanLogger from 'bunyan';

import { patchLogger } from './patch-logger';

@Module({
  // ...
  providersPerMod: [
    { provide: Logger, useFactory: patchLogger, deps: [LoggerConfig] }
    { provide: BunyanLogger, useExisting: Logger }
  ],
})
export class BunyanModule {}
```

DI буде викликати `patchLogger()` при першому запиті `Logger` і першим аргументом передасть інстанс `LoggerConfig` (який ми вказали в масиві `deps` у якості залежності).

## PinoModule

У застосунку Ditsmod логер [pino][7] налаштовується подібно до `bunyan`, за виключенням токена для DI. Справа в тому, що на даний момент бібліотека `pino` має лише інтерфейс для свого логера, а для DI було б краще мати клас замість інтерфейсу. Тому ми не можемо використати властивість [useExisting][8] для об'єкту провайдера. В такому разі в конструкторі контролера чи сервісу потрібно використовувати `@Inject`:

```ts
import { Inject } from '@ts-stack/di';
import { Logger } from '@ditsmod/core';
import { BaseLogger as PinoLogger } from 'pino';
// ...
  constructor(@Inject(Logger) private logger: PinoLogger) {}
```

Зверніть увагу, що у `PinoModule` та `BunyanModule` для DI не передається `LoggerConfig`, тому ці модулі матимуть дефолтне налаштування для рівня виводу інформації (`info`).

## WinstonModule

У застосунку Ditsmod логер [winston][5] налаштовується подібно до `pino`, але у `winston` є ще додаткові налаштування. Окрім цього, завдяки налаштуванню `LoggerConfig`, у межах `WinstonModule` буде змінено рівень виводу інформації на `debug`.

[5]: https://github.com/winstonjs/winston
[6]: https://github.com/trentm/node-bunyan
[7]: https://github.com/pinojs/pino
[8]: https://ts-stack.github.io/di/#useexisting
