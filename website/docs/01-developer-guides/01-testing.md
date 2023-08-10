---
sidebar_position: 0
---

# Тестування

## Unit-тестування

Зараз мабуть самим популярним фреймворком для написання юніт-тестів для JavaScript-коду є [jest][100]. В даній документації ми будемо використовувати саме цей фреймворк.

Якщо ви знаєте як працює [DI][1], ви легко зможете написати юніт-тести для класів Ditsmod-застосунку. Перш за все, ви повинні навчитись працювати з [інжекторами][2] та з [ієрархією інжекторів][3].

Припустимо, ви хочете протестувати `Service2` у цьому прикладі:

```ts
// service1.ts
import { injectable } from '@ditsmod/core';

class Service1 {
  saySomething() {
    return 'Hello';
  }
}

// service2.ts
@injectable()
class Service2 {
  constructor(private service1: Service1) {}

  method1() {
    return this.service1.saySomething();
  }
}
```

Як бачите, `Service2` залежить від `Service1`. Перед тим, як написати тести, давайте нагадаємо, як можна створити інжектор, який вміє вирішувати залежності класів з нашого прикладу:

```ts
import { Injector } from '@ditsmod/core';
import { Service1 } from './service1';
import { Service2 } from './service2';

const injector = Injector.resolveAndCreate([Service1, Service2]);
const service2 = injector.get(Service2);
```

Отже, на вході методу `Injector.resolveAndCreate()` ми передаємо масив усіх необхідних провайдерів, які прийматимуть участь у тестуванні, а на виході - нам видається інжекор, який вміє створювати значення для будь-якого переданого провайдера.

В даному разі, для створення `Service2`, інжектор спочатку створить інстанс класу `Service1`. Але щоб написати тести саме для `Service2`, нам не важливо чи справно працює `Service1`, тому замість справжнього класу `Service1` нам можна імітувати його роботу за допомогою [мок-функцій][101]. Ось як це виглядатиме (покищо без тестів):

```ts {6}
import { Injector } from '@ditsmod/core';
import { Service1 } from './service1';
import { Service2 } from './service2';

const injector = Injector.resolveAndCreate([
  { token: Service1, useValue: { saySomething: jest.fn() } },
  Service2
]);
const service2 = injector.get(Service2);
```

Як бачите, у виділеному рядку замість `Service1` передається провайдер значень з мок-функцією, яка буде імітувати роботу `Service1`.

Тепер можна написати тест, використовуючи цю техніку підміни провайдерів:

```ts {2,9}
describe('Service2', () => {
  const saySomething = jest.fn();
  let service2: Service2;

  beforeEach(() => {
    jest.restoreAllMocks();

    const injector = Injector.resolveAndCreate([
      { token: Service1, useValue: { saySomething } },
      Service2
    ]);

    service2 = injector.get(Service2);
  });

  it('should say "Hello, World!"', () => {
    saySomething.mockImplementation(() => 'Hello, World!');

    expect(service2).toBeInstanceOf(Service2);
    expect(service2.method1()).toBe('Hello, World!');
    expect(saySomething).toBeCalledTimes(1);
  });
});
```

Рекомендуємо тримати файли юніт-тестів поруч з тими файлами, які вони тестують. Тобто якщо файл називається `some.service.ts`, то файл тестів краще називати `some.service.spec.ts` або `some.service.test.ts`. Це суттєво спрощує роботу з тестами, а також дозволяє зразу бачити які файли ще не протестовані.

## End-to-end тестування

Під час end-to-end тестування перевіряють роботу цілого застосунку. Для цього можна використовувати, наприклад, [supertest][102]. Частіше за все, для такого тестування необхідно зробити моки тільки для тих сервісів, які працюють із зовнішніми сервісами: з базами даними, з відправкою email і т.д.

Давайте розглянемо ситуацію, коли ми робимо мок для `DatabaseService`:

```ts {17-19}
import request = require('supertest');
import { Server } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '../src/app/app.module';
import { DatabaseService } from '../src/app/database.service';
import { InterfaceOfDatabaseService } from '../src/app/types';

describe('End-to-end testing', () => {
  let server: Server;
  const query = jest.fn();
  const useValue = { query } as InterfaceOfDatabaseService;

  beforeEach(async () => {
    jest.restoreAllMocks();

    server = await new TestApplication(AppModule)
      .overrideProviders([{ token: DatabaseService, useValue }])
      .getServer();
  });

  it('work with DatabaseService', async () => {
    const values = [{ one: 1, two: 2 }];
    query.mockImplementation(() => values);

    await request(server)
      .get('/get-some-from-database')
      .expect(200)
      .expect(values);

    expect(query).toBeCalledTimes(1);

    server.close();
  });
});
```

:::info Дефолтний імпорт supertest
Перш за все, зверніть увагу у першому рядку на імпорт бібліотеки `supertest`. Це досить специфічний імпорт. Якщо ви тільки не використовуєте модулі ECMAScript, краще використовувати саме його для цієї бібліотеки.
:::

Як бачите, у виділених рядках створюється тестовий застосунок за допомогою інстансу класу `TestApplication`, потім робиться підстановка моку для `DatabaseService`. В самому кінці викликається метод `getServer()` і таким чином створюється та повертається вебсервер, який ще не викликав метод `server.listen()`, тому supertest має змогу автоматично це зробити підставляючи рандомний номер порту, що є важливим моментом під час асинхронного виклику зразу декількох тестів. Тут `AppModule` - це кореневий модуль застосунку.

Рекомендуємо подібні тести тримати в окремому каталозі з назвою `tests`, на одному рівні з кореневим каталогом `src`.




[1]: /components-of-ditsmod-app/dependency-injection
[2]: /components-of-ditsmod-app/dependency-injection#інжектор
[3]: /components-of-ditsmod-app/dependency-injection#ієрархія-інжекторів

[100]: https://jestjs.io/
[101]: https://jestjs.io/docs/mock-functions
[102]: https://github.com/ladjs/supertest
