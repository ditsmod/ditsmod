---
sidebar_position: 40
---

# Тестування

## Що таке unit-тестування

По-суті, юніт-тестування - це метод тестування, який дозволяє перевірити чи правильно працюють окремі найменші частини застосунку, такі як функції та методи класів (які по-суті також є функціями). Для проведення тестування, почергово фокусуються на окремій функції, при цьому ізолюють усі інші частини програми, які взаємодіють з цією функцією.

Правильно написані юніт-тести дозволяють читати їх як документацію до вашої програми. Можна сказати, що у більшості проектів документують лише публічну частину API застосунку, а решта - це TypeScript-типи, документація на основі юніт-тестів та коментарів у коді.

Одним із самих популярних фреймворків для написання юніт-тестів для JavaScript-коду є [jest][100]. В даному розділі ми будемо використовувати саме цей фреймворк.

## Попередні умови для написання юніт-тестів

Хороші знання в архітектурі [Ditsmod DI][1] допоможуть вам легко писати юніт-тести для Ditsmod-застосунків, оскільки однією з головних переваг DI - є полегшене тестування. Перш за все, ви повинні навчитись працювати з [інжекторами][2] та з [ієрархією інжекторів][3].

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

Оскільки `Service2` залежить від `Service1`, нам необхідно ізолювати цей сервіс від взаємодії з `Service1`. Перед тим, як написати тести, давайте нагадаємо, як можна створити інжектор, який вміє вирішувати залежності класів з нашого прикладу:

```ts
import { Injector } from '@ditsmod/core';
import { Service1 } from './service1.js';
import { Service2 } from './service2.js';

const injector = Injector.resolveAndCreate([Service1, Service2]);
const service2 = injector.get(Service2);
```

Отже, на вході методу `Injector.resolveAndCreate()` ми передаємо масив усіх необхідних провайдерів, які прийматимуть участь у тестуванні, а на виході - нам видається інжекор, який вміє створювати значення для будь-якого переданого провайдера.

В даному разі, для створення `Service2`, інжектор спочатку створить інстанс класу `Service1`. Але щоб написати тести саме для `Service2`, нам не важливо чи справно працює `Service1`, тому замість справжнього класу `Service1` нам можна імітувати його роботу за допомогою [мок-функцій][101]. Ось як це виглядатиме (покищо без тестів):

```ts {6}
import { Injector } from '@ditsmod/core';
import { Service1 } from './service1.js';
import { Service2 } from './service2.js';

const injector = Injector.resolveAndCreate([
  { token: Service1, useValue: { saySomething: jest.fn() } },
  Service2
]);
const service2 = injector.get(Service2);
```

Як бачите, у виділеному рядку замість `Service1` передається провайдер значень з мок-функцією, яка буде імітувати роботу `Service1`.

Тепер можна написати тест, використовуючи цю техніку підміни провайдерів:

```ts {6-7,14}
import { Injector } from '@ditsmod/core';
import { Service1 } from './service1.js';
import { Service2 } from './service2.js';

describe('Service2', () => {
  const saySomething = jest.fn();
  const MockService1 = { saySomething } as Service1;
  let service2: Service2;

  beforeEach(() => {
    jest.restoreAllMocks();

    const injector = Injector.resolveAndCreate([
      { token: Service1, useValue: MockService1 },
      Service2
    ]);

    service2 = injector.get(Service2);
  });

  it('should say "Hello, World!"', () => {
    saySomething.mockImplementation(() => 'Hello, World!');

    expect(service2).toBeInstanceOf(Service2);
    expect(service2.method1()).toBe('Hello, World!');
    expect(saySomething).toHaveBeenCalledTimes(1);
  });
});
```

Рекомендуємо тримати файли юніт-тестів поруч з тими файлами, які вони тестують. Тобто якщо файл називається `some.service.ts`, то файл тестів краще називати `some.service.spec.ts` або `some.service.test.ts`. Це суттєво спрощує роботу з тестами, а також дозволяє зразу бачити які файли ще не протестовані.

## End-to-end тестування

Під час end-to-end тестування перевіряють роботу цілого застосунку. Для цього можна використовувати, наприклад, [supertest][102]. Частіше за все, для такого тестування необхідно робити моки тільки для тих сервісів, які працюють із зовнішніми сервісами: з відправкою email, з базами даних і т.д. Решта застосунку працює так, як буде працювати у продуктовому режимі.

Давайте розглянемо ситуацію, коли ми робимо мок для `EmailService`:

```ts {12,19}
import request from 'supertest';
import { HttpServer } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';

import { AppModule } from '#app/app.module.js';
import { EmailService } from '#app/email.service.js';
import { InterfaceOfEmailService } from '#app/types.js';

describe('End-to-end testing', () => {
  let server: HttpServer;
  const query = jest.fn();
  const MockEmailService = { query } as InterfaceOfEmailService;

  beforeEach(async () => {
    jest.restoreAllMocks();

    server = await new TestApplication(AppModule)
      .overrideProviders([
        { token: EmailService, useValue: MockEmailService }
      ])
      .getServer();
  });

  it('work with EmailService', async () => {
    const values = [{ one: 1, two: 2 }];
    query.mockImplementation(() => values);

    await request(server)
      .get('/get-some-from-email')
      .expect(200)
      .expect(values);

    expect(query).toHaveBeenCalledTimes(1);

    server.close();
  });
});
```

Як бачите у коді тесту, спочатку створюється тестовий застосунок на базі класу `TestApplication`, потім робиться підстановка моку для `EmailService`. В самому кінці викликається метод `getServer()` і таким чином створюється та повертається вебсервер, який ще не викликав метод `server.listen()`, тому supertest має змогу автоматично це зробити підставляючи рандомний номер порту, що є важливим моментом під час асинхронного виклику зразу декількох тестів. Тут `AppModule` - це кореневий модуль застосунку.

Зверніть увагу, що у даних тестах не використовується код з файлу `./src/main.ts`, тому усі аргументи, які ви передали у цей код, потрібно продублювати і для `TestApplication`. Наприклад, якщо ваш застосунок має префікс `api`, значить передайте такий самий префікс і у тестовий застосунок:

```ts
server = await new TestApplication(AppModule, { path: 'api' }).getServer();
```

Підміна моків, за допомогою методу `testApplication.overrideProviders()`, працює глобально на будь-якому рівні ієрархії інжекторів. Провайдери з моками передаються до DI на певний рівень ієрархії, тільки якщо у застосунку на цьому рівні є відповідні провайдери з такими самими токенами.

Рекомендуємо подібні тести тримати в окремому каталозі з назвою `test`, на одному рівні з кореневим каталогом `src`.

### Вкладені провайдери для тестування

Нагадаємо, що у метод `testApplication.overrideProviders()` є сенс передавати лише моки тих провайдерів, які у застосунку ви вже передали до DI. Виходить, що моки не можуть мати залежність від нових провайдерів, яких не існує у застосунку. Тобто, якщо застосунок має провайдери `Service1` та `Service2`, то мок для підміни будь-якого з цих провайдерів не може містити залежність, наприклад, від `SpyService`. Саме тому для end-to-end тестування вводиться поняття "вкладених провайдерів", які вирішують залежність для нових провайдерів, запроваджених у моках:

```ts {6}
const server = await new TestApplication(AppModule)
  .overrideProviders([
    {
      token: Service1,
      useClass: MockService1,
      providers: [SpyService],
    },
  ])
  .getServer();
```

Як бачите, тут ми передаємо провайдер, в середині якого є властивість `providers`, яка може йти на одному рівні з властивістю `useClass` або `useFactory`. В даному разі, передбачається що `MockService1` має залежність від `SpyService`.

Звичайно ж, якщо є можливість, для моків краще використовувати `useValue`:

```ts {8}
const method1 = jest.fn();
const mockService1 = { method1 } as Service1;

const server = await new TestApplication(AppModule)
  .overrideProviders([
    {
      token: Service1,
      useValue: mockService1,
    },
  ])
  .getServer();
```

В такому разі вам не потрібні вкладені провайдери. Але не завжди певний сервіс може мати такий простий мок. Наприклад, якщо у даному разі `Service1` має залежність від об'єкту запиту, який генерує Node.js вебсервер, і ви не хочете підміняти цей об'єкт відповідним моком, для `Service1` мок може мати такий вигляд:

```ts {8,14}
import { inject, injectable, REQ, HttpRequest } from '@ditsmod/core';
import { SpyService } from './spy.service.js';

@injectable()
export class MockService1 extends Service1 {
  constructor(
    @inject(REQ) private httpReq: HttpRequest,
    private spyService: SpyService,
  ) {
    super(httpReq);
  }

  method1() {
    this.spyService.setInsights(this.httpReq.headers);
  }
}
```

Тут `SpyService` - це новий провайдер, створений лише для тестування, щоб через нього можна було програмно отримувати контекстну інформацію з робочого застосунку. В такому разі `MockService1` потрібно передавати у `useClass`, а у вкладених провайдерах передавати вже `SpyService`:

```ts {1-2,9}
const setInsights = jest.fn();
const spyService = { setInsights } as SpyService;

const server = await new TestApplication(AppModule)
  .overrideProviders([
    {
      token: Service1,
      useClass: MockService1,
      providers: [{ token: SpyService, useValue: spyService }],
    },
  ])
  .getServer();
```






[1]: /components-of-ditsmod-app/dependency-injection
[2]: /components-of-ditsmod-app/dependency-injection#інжектор
[3]: /components-of-ditsmod-app/dependency-injection#ієрархія-інжекторів

[100]: https://jestjs.io/
[101]: https://jestjs.io/docs/mock-functions
[102]: https://github.com/ladjs/supertest
