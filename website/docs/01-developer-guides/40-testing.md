---
sidebar_position: 40
---

# Тестування

## Що таке unit-тестування

По-суті, юніт-тестування - це метод тестування, який дозволяє перевірити чи правильно працюють окремі найменші частини застосунку, такі як функції та методи класів (які по-суті також є функціями). Для проведення тестування, почергово фокусуються на окремій функції, при цьому ізолюють усі інші частини програми, які взаємодіють з цією функцією. Правильно написані юніт-тести дозволяють читати їх як документацію до вашої програми.

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

```ts {8}
import { Injector } from '@ditsmod/core';
import { jest } from '@jest/globals';

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

```ts {8-9,16}
import { Injector } from '@ditsmod/core';
import { jest } from '@jest/globals';

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

```ts {14,21}
import request from 'supertest';
import { HttpServer } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';
import { jest } from '@jest/globals';

import { AppModule } from '#app/app.module.js';
import { EmailService } from '#app/email.service.js';
import { InterfaceOfEmailService } from '#app/types.js';

describe('End-to-end testing', () => {
  let server: HttpServer;
  let testAgent: ReturnType<typeof request>;
  const query = jest.fn();
  const MockEmailService = { query } as InterfaceOfEmailService;

  beforeEach(async () => {
    jest.restoreAllMocks();

    server = await TestApplication.createTestApp(AppModule)
      .overrideStatic([
        { token: EmailService, useValue: MockEmailService }
      ])
      .getServer();

    testAgent = request(server);
  });

  afterAll(() => {
    server?.close();
  });

  it('work with EmailService', async () => {
    const values = [{ one: 1, two: 2 }];
    query.mockImplementation(() => values);

    const { status, type, body } = await testAgent.get('/get-some-from-email');
    expect(status).toBe(200);
    expect(type).toBe('application/json');
    expect(body).toBe(values);
    expect(query).toHaveBeenCalledTimes(1);
  });
});
```

Як бачите у коді тесту, спочатку створюється тестовий застосунок на базі класу `TestApplication`, потім робиться підстановка моку для `EmailService`. В самому кінці викликається метод `getServer()` і таким чином створюється та повертається вебсервер, який ще не викликав метод `server.listen()`, тому supertest має змогу автоматично це зробити підставляючи рандомний номер порту, що є важливим моментом під час асинхронного виклику зразу декількох тестів. Тут `AppModule` - це кореневий модуль застосунку.

Зверніть увагу, що у даних тестах не використовується код з файлу `./src/main.ts`, тому усі аргументи, які ви передали у цей код, потрібно продублювати і для `TestApplication`. Наприклад, якщо ваш застосунок має префікс `api`, значить передайте такий самий префікс і у тестовий застосунок:

```ts
server = await TestApplication.createTestApp(AppModule, { path: 'api' }).getServer();
```

### `testApplication.overrideStatic()`

Метод `testApplication.overrideStatic()` підміняє провайдери, які додаються статично в метадані модулів. Провайдери з моками передаються до DI на певний рівень ієрархії, тільки якщо у застосунку на цьому рівні є відповідні провайдери з такими самими токенами.

### `testApplication.overrideDynamic()`

Метод `testApplication.overrideDynamic()` підміняє провайдери, що додаються розширеннями динамічно. Цей метод приймає два аргументи:

1. токен групи розширень, від яких повертаються метадані, де потрібно буде підмінити провайдери для тестів;
2. колбек, що буде працювати з метаданими, які повертає група розширень (указана у першому аргументі).

Колбек у другому аргументі має наступний тип:

```ts
interface GroupMetaOverrider<T = any> {
  (stage1GroupMeta: Stage1GroupMeta<T> | Stage1GroupMeta2<T>): void;
}
```

Тобто даний колбек приймає єдиний аргумент - об'єкт, де у властивості `groupData` ви можете знайти метадані, з указаної групи розширень.

Нижче описано [TestRoutingPlugin][4], де показано як можна використовувати `testApplication.overrideDynamic()`.

### `testApplication.$use()`

Даний метод призначений для створення плагінів, які можуть динамічно додавати методи та властивості до інстансу `TestApplication`:

```ts
import { TestApplication } from '@ditsmod/testing';

class Plugin1 extends TestApplication {
  method1() {
    // ...
    return this;
  }
}

class Plugin2 extends TestApplication {
  method2() {
    // ...
    return this;
  }
}

class AppModule {}

TestApplication.createTestApp(AppModule)
  .$use(Plugin1, Plugin2)
  .method1()
  .method2()
  .overrideStatic([]);
```

Як бачите, після використання `$use()` інстанс `TestApplication` може використовувати методи плагінів. [Приклад використання такого плагіна в реальному житті][103] можна проглянути в модулі `@ditsmod/routing`.


### `TestRoutingPlugin`

В класі `TestRoutingPlugin` використовується `testApplication.overrideDynamic()` для підміни динамічно доданих провайдерів у розширеннях групи `ROUTES_EXTENSIONS`.

```ts
import { Provider } from '@ditsmod/core';
import { MetadataPerMod3, ROUTES_EXTENSIONS } from '@ditsmod/routing';
import { TestApplication, GroupMetaOverrider } from '@ditsmod/testing';

export class TestRoutingPlugin extends TestApplication {
  overrideGroupRoutingMeta(providersToOverride: Provider[]) {
    const overrideRoutesMeta: GroupMetaOverrider<MetadataPerMod3> = (stage1GroupMeta) => {
      stage1GroupMeta.groupData?.forEach((metadataPerMod3) => {
        // ...
      });
    };

    this.overrideDynamic(ROUTES_EXTENSIONS, overrideRoutesMeta);
    return this;
  }
}
```

Ви можете використовувати цей приклад для створення плагінів, що будуть підміняти провайдери для інших груп розширень. Повний приклад з `TestRoutingPlugin` ви можете знайти [в репозиторії Ditsmod][104].

### Вкладені провайдери для тестування

Нагадаємо, що у метод `testApplication.overrideStatic()` є сенс передавати лише моки тих провайдерів, які у застосунку ви вже передали до DI. Виходить, що моки не можуть мати залежність від нових провайдерів, яких не існує у застосунку. Тобто, якщо застосунок має провайдери `Service1` та `Service2`, то мок для підміни будь-якого з цих провайдерів не може містити залежність, наприклад, від `SpyService`. Саме тому для end-to-end тестування вводиться поняття "вкладених провайдерів", які вирішують залежність для нових провайдерів, запроваджених у моках:

```ts {6}
const server = await TestApplication.createTestApp(AppModule)
  .overrideStatic([
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

const server = await TestApplication.createTestApp(AppModule)
  .overrideStatic([
    {
      token: Service1,
      useValue: mockService1,
    },
  ])
  .getServer();
```

В такому разі вам не потрібні вкладені провайдери. Але не завжди певний сервіс може мати такий простий мок. Наприклад, якщо у даному разі `Service1` має залежність від об'єкту запиту, який генерує Node.js вебсервер, і ви не хочете підміняти цей об'єкт відповідним моком, для `Service1` мок може мати такий вигляд:

```ts {8,14}
import { inject, injectable, RAW_REQ, RawRequest } from '@ditsmod/core';
import { SpyService } from './spy.service.js';

@injectable()
export class MockService1 extends Service1 {
  constructor(
    @inject(RAW_REQ) private rawReq: RawRequest,
    private spyService: SpyService,
  ) {
    super(rawReq);
  }

  method1() {
    this.spyService.setInsights(this.rawReq.headers);
  }
}
```

Тут `SpyService` - це новий провайдер, створений лише для тестування, щоб через нього можна було програмно отримувати контекстну інформацію з робочого застосунку. В такому разі `MockService1` потрібно передавати у `useClass`, а у вкладених провайдерах передавати вже `SpyService`:

```ts {1-2,9}
const setInsights = jest.fn();
const spyService = { setInsights } as SpyService;

const server = await TestApplication.createTestApp(AppModule)
  .overrideStatic([
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
[4]: #testapplicationoverridedynamic

[100]: https://jestjs.io/
[101]: https://jestjs.io/docs/mock-functions
[102]: https://github.com/ladjs/supertest
[103]: https://github.com/ditsmod/ditsmod/blob/c42c834cb9/packages/routing/e2e/main.spec.ts#L39
[104]: https://github.com/ditsmod/ditsmod/blob/aca9476a870/packages/routing-testing/src/test-routing.plugin.ts
