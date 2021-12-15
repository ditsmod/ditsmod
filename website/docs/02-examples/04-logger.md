# 04-logger

Щоб спробувати даний приклад, необхідно спочатку [підготувати передумови](./prerequisite).

У цьому прикладі, показано як можна в одному застосунку мати відразу чотири логера:

- `DefaultLogger`;
- [bunyan][6];
- [pino][7];
- [winston][5];

На практиці такий приклад наврядчи може знадобитись, але він демонструє роботу
ієрархічної архітектури DI, правила експорту/імпорту провайдерів, механізм підміни by default
логера та by default конфігурації для логера.

У `PinoModule`, `BunyanModule` та `WinstonModule` зроблено підміни by default логера, причому зроблено це в
масиві `providersPerMod`. І саме тому контролери в цих модулях будуть використовувати відповідно
pino, bunyan та winston.

Тут варто звернути увагу, що в конструкторах будь-яких класів використовується by default логер у
якості [токена][104], а DI вже підставляє для різних контролерів різні логери.

```ts
import { Controller, Logger, Response, Route } from '@ditsmod/core';

// ...
constructor(private res: Response, private log: Logger) {}
// ...
```

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

[5]: https://github.com/winstonjs/winston
[6]: https://github.com/trentm/node-bunyan
[7]: https://github.com/pinojs/pino

[104]: ../core/dependency-injection#токени-di
