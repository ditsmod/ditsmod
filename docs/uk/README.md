# Що таке Ditsmod

Ditsmod є Node.js веб-фреймворком, його назва складається із **DI** + **TS** + **Mod**, щоб
підкреслити важливі складові: він має **D**ependency **I**njection, написаний на
**T**ype**S**cript, та спроектований для хорошої **Mod**ularity (тобто модульності).

Головні особливості Ditsmod:
- Зручний механізм [указання та вирішення залежностей][8] між різними класами застосунку: ви в
конструкторі указуєте інстанси яких класів вам потрібні, а DI бере на себе непросту задачу "де
їх взяти".
- Можливість легко підмінювати by default класи в ядрі Ditsmod своїми власними класами.
Наприклад, швидше за все, ви захочете підмінити клас логера на ваш власний клас, оскільки
by default логер нічого не записує ні в консоль, ні у файл.
- Можливість легко підмінювати класи вашого застосунку тестовими класами (mocks, stubs), не
змінюючи при цьому код вашого застосунку. Це дуже суттєво спрощує тестування.
- Ditsmod спроектований, щоб забезпечувати хорошу модульність всього застосунку, а отже і хорошу
масштабованість. Його DI підтримує ієрархію, а це означає, що ви можете оголошувати
[одинаків][12]: або на рівні усього застосунку, або на рівні конкретного модуля, або на рівні
HTTP-запиту.

Ті, хто знайомий з [Angular][9], помітить, що деякі концепції архітектури цього фреймворка дуже
схожі на Angular концепції. Це справді так, більше того - сам [DI][11] фактично витягнутий з
Angular v4.4.7. (з мінімальними допрацюваннями) та інтегрований в Ditsmod.

## Зміст

- [Встановлення](#встановлення)
- [Запуск](#запуск)
- [Вхідний файл для Node.js][123]
- [Кореневий модуль][102]
- [Контролер][103]
- [Оголошення контролера][111]
- [Сервіс][104]
- [Впровадження залежностей][105]
  - [Оголошення рівня провайдерів та підміна провайдерів][100]
- [Експорт провайдерів у звичайному модулі][107]
- [Експорт провайдерів у кореневому модулі][108]
- [Імпорт модуля][109]
- [Реекспорт модуля][110]
- [Префікси маршрутів][112]
- [Guards][113]
  - [Параметри для guards][114]
- [Автоматичний парсинг тіла HTTP-запиту][115]
- [Підміна by default класів Ditsmod][116]
- [Різниця між областю видимості провайдерів та їх рівнями оголошення][117]
- [Інжектори DI][118]
  - [Токени DI][119]
  - [InjectionToken][120]
- [Непередбачувана пріоритетність провайдерів][121]
- [Домовленості по стилю коду][122]

## Встановлення

Мінімальний базовий набір для роботи застосунку має репозиторій [ditsmod-seed][2].
Клонуйте його та встановіть залежності:

```bash
git clone git@github.com:ts-stack/ditsmod-seed.git my-app
cd my-app
npm i
```

Окрім цього, можете проглянути більше прикладів у теці [examples][4].

## Запуск

```bash
npm start
```

Перевірити роботу сервера можна за допомогою `curl`:

```bash
curl -isS localhost:8080
```

## Вхідний файл для Node.js

Після [встановлення Ditsmod seed](#встановлення), перше, що необхідно знати: весь код застосунку
знаходиться у теці `src`, він компілюється за допомогою TypeScript-утиліти `tsc`, після
компіляції попадає у теку `dist`, і далі вже у вигляді JavaScript-коду його можна виконувати у
Node.js.

Давайте розглянемо файл `src/main.ts`:

```ts
import 'reflect-metadata';
import { AppFactory } from '@ts-stack/ditsmod';

import { AppModule } from './app/app.module';

new AppFactory()
  .bootstrap(AppModule)
  .then(({ server, log }) => {
    server.on('error', (err) => log.error(err));
  })
  .catch(({ err, log }) => {
    log.fatal(err);
    throw err;
  });
```

Після компіляції, він перетворюється на `dist/main.js` та стає вхідною точкою для запуску
застосунку, і саме тому ви будете його вказувати у якості аргументу для Node.js:

```bash
node dist/main.js
```

Слід звернути увагу на `import 'reflect-metadata'` у першому рядку файла. Цей модуль необхідний
для роботи Ditsmod, але його достатньо указувати єдиний раз у вхідному файлі для Node.js.

Бажано запам'ятати дане правило на майбутнє, і застосовувати його також для написання тестів,
оскільки в такому разі вхідним файлом вже буде файл тесту, а не `dist/main.js`. Наприклад, якщо
ви будете використовувати [jest][10] у якості фреймворку для тестів, а файл
`path/to/test-file.js` міститиме скомпільований тест, то щоб запустити його ось так:

```bash
jest path/to/test-file.js
```

у файлі `path/to/test-file.js` повинен бути імпорт `reflect-metadata`.

Проглядаючи далі файл `src/main.ts`, ми бачимо, що створюється інстанс класу `AppFactory`, а у
якості аргументу для методу `bootstrap()` передається `AppModule`. Тут `AppModule` є кореневим
модулем, до якого вже підв'язуються інші модулі застосунку.

## Кореневий модуль Ditsmod

До кореневого модуля підв'язуються інші модулі, він є єдиним на увесь застосунок.
TypeScript клас стає кореневим модулем Ditsmod завдяки декоратору `RootModule`:

```ts
import { RootModule } from '@ts-stack/ditsmod';

@RootModule()
export class AppModule {}
```

Щоб запустити порожній застосунок, цього вже буде достатньо. Але для повноцінної роботи,
щоб можна було обробляти певні URL маршрути, потрібні контролери.

## Контролер

TypeScript клас стає контролером Ditsmod завдяки декоратору `Controller`:

```ts
import { Controller } from '@ts-stack/ditsmod';

@Controller()
export class SomeController {}
```

Як і належить кожному контролеру, він повинен містити маршрути (Route), а також,
як мінімум, повинен мати доступ до об'єкта відповіді (Response). В наступному прикладі створено
два маршрути, що приймають `GET` запити за адресами `/hello` та `/throw-error`. Зверніть увагу
як у конструкторі ми отримуємо інстанс класу `Response`:

```ts
import { Controller, Response, Route } from '@ts-stack/ditsmod';

@Controller()
export class SomeController {
  constructor(private res: Response) {}

  @Route('GET', 'hello')
  tellHello() {
    this.res.send('Hello World!');
  }

  @Route('GET', 'throw-error')
  thrwoError() {
    throw new Error('Here some error occurred');
  }
}
```

Що ми тут бачимо:
1. В конструкторі класу за допомогою модифікатора доступу `private` оголошується властивість
класу `res` із типом даних `Response`.
1. Маршрути створюються за допомогою декоратора `Route`, що ставиться перед методом класу.
1. Відповіді на HTTP-запити відправляються через `this.res.send()` (хоча `this.res` ще має
`sendJson()` та `sendText()`).
1. Об'єкти помилок можна кидати прямо в методі класу звичайним для JavaScript способом, тобто за
допомогою ключового слова `throw`. Хоча, на даний момент, якщо відправити запит по цьому
маршруту, то він зависне, через відсутність обробника помилок. Як створити обробника
помилок для контролерів - прогляньте [API ControllerErrorHandler][124].

**Уточнення**: модифікатор доступу в конструкторі може бути будь-яким (`private`, `protected`
або `public`), але взагалі без модифікатора - `res` вже буде простим параметром з видимістю лише
в конструкторі.

Щойно в конструкторі ми отримали інстанс класу `Response`, він представляє собою так званий
сервіс.

## Сервіс

TypeScript клас стає сервісом Ditsmod завдяки декоратору `Injectable`:

```ts
import { Injectable } from '@ts-stack/di';

@Injectable()
export class SomeService {}
```

Зверніть увагу, що цей декоратор імпортується із `@ts-stack/di`, а не із `@ts-stack/ditsmod`.
Приклади сервісів в затосунках Ditsmod:
- сервіс надання конфігурації;
- сервіс роботи з базами даних, з поштою і т.п.;
- сервіс парсингу тіла HTTP-запиту;
- сервіс перевірки прав доступу;
- і т.д.

Часто одні сервіси залежать від інших сервісів, і щоб отримати інстанс певного сервіса,
необхідно указати його клас в конструкторі:

```ts
import { Injectable } from '@ts-stack/di';

import { FirstService } from './first.service';

@Injectable()
export class SecondService {
  constructor(private firstService: FirstService) {}

  methodOne() {
    this.firstService.doSomeThing();
  }
}
```

Як бачите, правила отримання інстансу класу в сервісі такі ж самі, як і в контролері. Тобто, ми
в конструкторі за допомогою модифікатора доступу `private` оголошуємо властивість класу
`firstService` із типом даних `FirstService`. Інстанси в конструкторі створює система впровадження
залежностей (англ. Dependency Injection).

**Уточнення**: модифікатор доступу в конструкторі може бути будь-яким (`private`, `protected`
або `public`), але взагалі без модифікатора - `firstService` вже буде простим параметром з
видимістю лише в конструкторі.

## Впровадження залежностей

**Примітка** В даній документації [система для впровадження залежностей][8] буде скорочено називатись DI від
англ. "Dependency Injection".

Щоб надавати в конструкторі класу те, що ви запитуєте, DI повинен бути проінструктований
звідки це брати. І це може здатись дивним. Чому? - Давайте глянемо на приклад:

```ts
import { Injectable } from '@ts-stack/di';

import { FirstService } from './first.service';

@Injectable()
export class SecondService {
  constructor(private firstService: FirstService) {}

  methodOne() {
    this.firstService.doSomeThing();
  }
}
```

Тут DI повинен створити інстанс класу `FirstService` і, на перший погляд, ви чітко прописуєте
з якого файлу імпортувати даний клас, але цього не достатньо.

[Пізніше][100] ви дізнаєтесь, що не змінюючи коду в даному прикладі, ви можете підмінити клас
`FirstService`, наприклад, тестовим класом. Коли ви підмінюєте один клас іншим класом ви, можна
сказати, надаєте інший **провайдер** для створення інстансу класу `FirstService`. Причому цих
провайдерів може бути багато, але DI вибирає завжди той із них, що вказаний самим останнім
(див. [механізм указання провайдерів][100]).

Точно так само, не змінюючи коду прикладу, ви ще можете
змінити **рівень**, на якому оголошено провайдер для `FirstService`, щоб його інстанс
створювався:
- або один єдиний раз при старті застосунку;
- або кожен раз, коли його імпортують в черговий модуль;
- або за кожним HTTP-запитом.

Оскільки, не змінюючи коду даного прикладу, ви можете отримувати різні результати у властивості
`firstService`, виходить, що не достатньо просто указати джерело імпорту для певного сервіса.
Для однозначності, як мінімум, необхідно додатково оголосити **рівень** провайдера
`FirstService`.

### Оголошення рівня провайдерів та підміна провайдерів

Оголошення рівня провайдерів означає, що на цьому рівні зазначені класи провайдерів будуть
[одинаками][12]. Таке оголошення робиться або у метаданих модуля, або у
метаданих контролера.

Наприклад, в контролері можна оголосити провайдерів на рівні HTTP-запиту:

```ts
import { Controller } from '@ts-stack/ditsmod';

import { SomeService } from './some.service';

@Controller({ providersPerReq: [SomeService] })
export class SomeController {
  constructor(private someService: SomeService) {}
}
```

Як бачимо, в метаданих переданих в декоратор `Controller` передається об'єкт із властивістю
`providersPerReq`, куди передається масив провайдерів.

А якщо ми захочемо зробити підміну провайдера, то ми запишемо це так:

```ts
import { Controller } from '@ts-stack/ditsmod';

import { FirstService } from './first.service';
import { SecondService } from './second.service';

@Controller({ providersPerReq: [{ provide: FirstService, useClass: SecondService }] })
export class SomeController {
  constructor(private firstService: FirstService) {}
}
```

Тобто замість передачі класу `FirstService` у масив `providersPerReq` ми передаємо об'єкт
`{ provide: FirstService, useClass: SecondService }`. Таким чином ми інструктуємо DI щоб для
конструктора замість інстансу класу `FirstService`, передавати інстанс класу `SecondService`.

В модулі також можна оголошувати провайдери на рівні HTTP-запиту, але вони матимуть нижчій
пріоритет, ніж оголошення через контролер:

```ts
import { Module } from '@ts-stack/ditsmod';

import { SomeService } from './some.service';

@Module({
  providersPerApp: [],
  providersPerMod: [],
  providersPerReq: [SomeService],
})
export class SomeModule {}
```

Як бачите, в метаданих модуля оголошувати провайдери вже можна на **трьох рівнях**.

До речі, зверніть увагу, що тут використано декоратор `Module`, завдяки якому
TypeScript клас перетворюється на модуль Ditsmod.

### Пріоритетність провайдерів

Один і той самий провайдер можна оголошувати одночасно на трьох рівнях, але провайдери у масиві
`providersPerReq` матимуть найвищий пріоритет, у `providersPerMod` - середній пріоритет, а у
`providersPerApp` - найнижчий пріоритет.

Це можна використовувати, наприклад, так:
1. спочатку у кореневому модулі оголосити певний провайдер конфігурації **на рівні застосунку**
2. при потребі змінити дану конфігурацію лише для окремого модуля, ви оголошуєте цей же провайдер
конфігурації, але вже **на рівні модуля**, і робите його підміну.

Окрім цього, якщо ви імпортуєте певний провайдер із зовнішнього модуля, і у вас у поточному модулі
є провайдер, із таким же [токеном][119], то локальний провайдер матиме вищій пріоритет, при умові,
що вони оголошені на однаковому рівні. Аналогічне правило діє і для контролера - провайдер,
оголошений у контролері, матиме вищій пріоритет, ніж провайдер, із таким же токеном, оголошений
в модулі. 

## Експорт провайдерів зі звичайного модуля

Експортуючи провайдери з певного модуля, ви тим самим декларуєте, що вони є доступними для
використання в інших модулях, які імпортуватимуть цей модуль:

```ts
import { Module } from '@ts-stack/ditsmod';

import { SomeService } from './some.service';

@Module({
  exports: [SomeService],
  providersPerMod: [SomeService],
})
export class SomeModule {}
```

Зверніть увагу, що відбувається не лише додавання `SomeService` в масив `exports`, одночасно цей
провайдер оголошується на рівні `providersPerMod`. При експорті, _оголошення_ провайдера на
певному рівні є обов'язковим. Виключення з цього правила стосується лише імпортованих
провайдерів, оскільки у своїх модулях вони вже оголошені на певних рівнях.

Експортувати провайдери можна лише ті, що оголошені:
1. або на рівні модуля (тобто в масиві `providersPerMod`)
2. або на рівні HTTP-запиту (тобто в масиві `providersPerReq`).

Експортувати провайдери, що оголошені на рівні застосунку (тобто в масиві `providersPerApp`)
не має сенсу, оскільки _оголошення_ їх на рівні застосунку вже має на увазі _експорт_ їх
на цьому рівні.

Також не має сенсу експортувати чи імпортувати класи контролерів, оскільки імпорт стосується лише
провайдерів та префіксів маршрутів (див. далі [імпорт модуля][126]), а експорт
стосується виключно провайдерів.

## Експорт провайдерів із кореневого модуля

Експорт провайдерів із кореневого модуля означає, що ці провайдери стають доступними для
будь-якого сервіса чи контролера у всьому застосунку, причому їхні рівні оголошення зберігаються:

```ts
import { RootModule } from '@ts-stack/ditsmod';

import { SomeService } from './some.service';

@RootModule({
  exports: [SomeService],
  providersPerMod: [SomeService],
})
export class AppModule {}
```

## Імпорт модуля

Імпортувати окремий провайдер не можна, але можна імпортувати цілий модуль із усіма провайдерами, що експортуються в ньому:

```ts
import { Module } from '@ts-stack/ditsmod';

import { FirstModule } from './first.module';
import { SecondModule } from './second.module';

@Module({
  imports: [
    FirstModule,
    { prefix: 'some-prefix', module: SecondModule }
  ]
})
export class ThridModule {}
```

Якщо у `FirstModule` експортується, наприклад, `SomeService`, то тепер цей сервіс можна
використовувати у `ThridModule` у будь-якому його сервісі чи контролері.

Зверніть увагу, що при імпорті рівень оголошення провайдера залишається таким самим, яким він
був при експорті. Наприклад, якщо `SomeService` було оголошено на рівні модуля, то і при імпорті
залишиться цей же рівень.

Як бачите, масив `imports` приймає окрім класів модулів, ще й об'єкт
`{ prefix: 'some-prefix', module: SecondModule }`. Вказаний префікс `some-prefix` буде
використовуватись для маршрутизації, якщо у `SecondModule` оголошено контролери.

## Реекспорт модуля

Окрім імпорту певного модуля, цей же модуль можна одночасно й експортувати:

```ts
import { Module } from '@ts-stack/ditsmod';

import { FirstModule } from './first.module';

@Module({
  imports: [FirstModule],
  exports: [FirstModule],
})
export class SecondModule {}
```

Який у цьому сенс? - Тепер, якщо ви зробите імпорт `SomeModule` у якийсь інший модуль, ви
фактично матимете імпортованим ще й `FirstModule`.

## Оголошення контролера

Оголошувати контролер можна у будь-якому модулі, у масиві `controllers`:

```ts
import { Module } from '@ts-stack/ditsmod';

import { SomeController } from './first.controller';

@Module({
  controllers: [SomeController]
})
export class SomeModule {}
```

## Префікси маршрутів

Якщо звичайний модуль імпортувати з префіксом, даний префікс буде додаватись до усіх маршрутів
(роутів), в межах цього модуля:

```ts
import { Module } from '@ts-stack/ditsmod';

import { FirstModule } from './first.module';
import { SecondModule } from './second.module';

@Module({
  imports: [
    { prefix: 'some-prefix', module: FirstModule }
    { prefix: 'other-prefix/:pathParam', module: SecondModule }
  ]
})
export class ThridModule {}
```

Тут під записом `:pathParam` мається на увазі не просто текст, а саме параметр - змінна частина
в URL перед query параметрами.

Якщо ж в кореневому модулі указати `prefixPerApp`, цей префікс буде додаватись до усіх маршрутів
в усьому застосунку:

```ts
import { RootModule } from '@ts-stack/ditsmod';

import { SomeModule } from './some.module';

@RootModule({
  prefixPerApp: 'api',
  imports: [SomeModule]
})
export class AppModule {}
```

## Guards

Якщо вам необхідно щоб до певних маршрутів мали доступ, наприклад, лише авторизовані користувачі,
ви можете у третьому параметрі декоратора `Route` указати `AuthGuard` в масиві:

```ts
import { Controller, Response, Route } from '@ts-stack/ditsmod';

import { AuthGuard } from './auth.guard';

@Controller()
export class SomeController {
  constructor(private res: Response) {}

  @Route('GET', 'some-url', [AuthGuard])
  tellHello() {
    this.res.send('Hello admin!');
  }
}
```

Будь-який guard повинен імплементувати інтерфейс `CanActivate`:

```ts
interface CanActivate {
  canActivate(params?: any[]): boolean | number | Promise<boolean | number>;
}
```

Наприклад, це можна зробити так:

```ts
import { Injectable } from '@ts-stack/di';
import { CanActivate } from '@ts-stack/ditsmod';

import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate() {
    return Boolean(await this.authService.updateAndGetSession());
  }
}
```

Звичайно ж, це спрощена версія, в реальних застосунках треба робити додаткові перевірки,
наприклад наявності XSRF-токена. Але головна суть зрозуміла - кожен гард є сервісом, що має
метод `canActivate()`, який повертає `boolean | number | Promise<boolean | number>`.

До речі, якщо гард повертає `number`, то Ditsmod інтерпретує це як номер статусу (403, 401
і т.п.), який треба повернути у відповіді на HTTP-запит.

### Параметри для guards

У метод `canActivate()` гард має один параметр. Аргументи для цього параметру можна передавати
у декораторі `Route` у масиві, де на першому місці йде певний гард.

Давайте розглянемо такий приклад:

```ts
import { Controller, Response, Route } from '@ts-stack/ditsmod';

import { PermissionsGuard } from './permissions.guard';
import { Permission } from './permission';

@Controller()
export class SomeController {
  constructor(private res: Response) {}

  @Route('GET', 'some-url', [[PermissionsGuard, Permission.canActivateAdministration]])
  tellHello() {
    this.res.send('Hello admin!');
  }
}
```

Як бачите, на місці третього параметра у `Route` передається масив в масиві, де на першому місці
указано `PermissionsGuard`, а далі йдуть аргументи для нього. В такому разі `PermissionsGuard`
отримає ці аргументи у своєму методі `canActivate()`:

```ts
import { Injectable } from '@ts-stack/di';
import { CanActivate, Status } from '@ts-stack/ditsmod';

import { AuthService } from './auth.service';
import { Permission } from './permission';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(params?: Permission[]) {
    if (await this.authService.hasPermissions(params)) {
      return true;
    } else {
      return Status.FORBIDDEN;
    }
  }
}
```

## Автоматичний парсинг тіла HTTP-запиту

На етапі ініціалізації застосунку, Ditsmod проглядає який HTTP-метод указується в декораторі
`Route` для певного маршрута, щоб визначити чи потрібно парсити тіло запиту в майбутньому.
Перелік HTTP-методів, для яких потрібно парсити тіло запиту, указано в класі
`BodyParserConfig` у властивості `acceptMethods`: 

```ts
export class BodyParserConfig {
  acceptMethods: HttpMethod[] = ['POST', 'PUT', 'PATCH'];
  maxBodySize: number = 1024 * 1024 * 5; // 5 MB
  multipartOpts: MultipartBodyParserOptions = {};
}
```

Оскільки цей клас Ditsmod отримує від DI, ви можете змінити дані налаштування підмінивши
`BodyParserConfig` вашим власним класом:

```ts
import { Module, BodyParserConfig } from '@ts-stack/ditsmod';

import { MyBodyParserConfig } from './my-body-parser-config';

@Module({
  providersPerMod: [{ provide: BodyParserConfig, useClass: MyBodyParserConfig }]
})
export class SomeModule {}
```

Враховуючи те, що `BodyParserConfig` у ядрі Ditsmod оголошено на рівні застосунку, ви можете
[понизити цей рівень][127] до рівня модуля, чи запиту. Якраз це і відбувається в даному
прикладі, бо тут `BodyParserConfig` оголошується вже на рівні модуля. Це означає, що внесені
вами зміни будуть діяти в межах `SomeModule`.

Хоча можете для `BodyParserConfig` залишити й незмінним рівень оголошення, тобто
передати `BodyParserConfig` в масиві `providersPerApp`. Все одно ваш провайдер матиме вищий
пріоритет, ніж by default провайдер, переданий в ядрі Ditsmod, оскільки він передався до DI
пізніше.

## Підміна by default класів Ditsmod

У ядрі Ditsmod оголошуються наступні провайдери:

### на рівні застосунку
- [Logger][130]
- [BodyParserConfig][128]
- [Router][131]
- [PreRequest][129]

### на рівні HTTP-запиту
- [Request][133]
- [Response][134]
- [BodyParser][132]
- [ControllerErrorHandler][124]

Оскільки усі ці початкові (тобто by default) провайдери додаються до DI на початку масиву,
кожного із них ви можете підмінити своїми провайдерами.

Мабуть перше, що ви захочете підмінити - це провайдер логера, оскільки початково `Logger` нічого
нікуди не пише, і використовується виключно як токен для DI, а також як інтерфейс.

Що означає "використовується як інтерфейс"? - Це означає, що якщо ви хочете підміняти `Logger`
своїм провайдером, ваш провайдер повинен мати такі ж методи, і таку ж сигнатуру цих методів як
вони є у [Logger][125].

Коли ваш провайдер впровадить інтерфейс `Logger`, вам залишиться зробити його підміну
за допомогою DI:

```ts
import { RootModule, Logger } from '@ts-stack/ditsmod';

import { MyLogger } from './my-logger';

@RootModule({
  providersPerApp: [{ provide: Logger, useClass: MyLogger }]
})
export class SomeModule {}
```

Щоб підмінити будь-який початковий провайдер Ditsmod вашим власним провайдером,
алгоритм ваших дій такий же, як це було показано у попередньому прикладі:
1. вивчаєте API провайдерів, які ви хочете підмінити;
2. впроваджуєте такий самий API у своїх провайдерів;
3. робите підміну початкового провайдера вашим провайдером.

## Різниця між областю видимості провайдерів та їх рівнями оголошення

Не варто плутати три рівня оголошення провайдерів із областю їх видимості.
Коли ви передаєте провайдер у один із масивів: `providersPerApp`, `providersPerMod` чи
`providersPerReq` - тим самим ви декларуєте на якому рівні буде створюватись [одинак][12] даного
провайдера. Але це не теж саме, що область видимості провайдерів.

Наприклад, якщо у `SomeModule` ви оголосили `ConfigService` на рівні `providersPerMod`, це
означає, що одинак `ConfigService` буде створений на рівні `SomeModule` і стане доступним лише в
межах цього модуля. Тобто будь-який інший модуль покищо не зможе побачити `ConfigService`.

Разом із тим, щоб збільшити область видимості `ConfigService` ви повинні експортувати його із
`SomeModule`, після чого усі модулі, що імпортують `SomeModule`, теж матимуть свій окремий
одинак `ConfigService` на рівні модуля.

Як бачите, область видимості провайдерів розширюється за допомогою
[експорту цих провайдерів][101] з подальшим імпортом модулів, де вони оголошені. Хоча, якщо
провайдери оголошені у кореневому модулі, і вони потрібні вам в іншому модулі, імпортувати
кореневий модуль не потрібно. Достатньо в кореневому модулі зробити експорт потрібних
провайдерів, після чого їх область видимості збільшиться на увесь застосунок.

Але якщо область видимості не розширювати, вона буде обмежуватись лише ієрархією інжекторів DI
(див. наступний розділ).

## Інжектори DI

Інжектори є складовою частиною DI, і хоча раніше вони майже не згадувались в документації,
але ви з їхньою роботою вже трохи знайомі. Саме інжектори видають вам те, що ви запитуєте
у конструкторах класів. Вони мають ієрархічну архітектуру:

1. Самий вищий в ієрархії - інжектор на рівні застосунку, він бачить лише ті провайдери,
що ви передаєте у масиві `providersPerApp` будь-де в застосунку. Він є єдиним на весь застосунок.
2. Нижче в ієрархії знаходиться інжектор на рівні модуля, він бачить усі провайдери, що ви
передаєте у масиві `providersPerMod` для конкретного модуля, а також у масиві `providersPerApp`
будь-де в застосунку. Кількість таких інжекторів дорівнює кількості модулів у застосунку.
3. Самим нижчим в ієрархії є інжектор на рівні HTTP-запиту, він бачить усі провайдери, що ви
передаєте у `providersPerReq` та `providersPerMod` конкретного модуля, а також у
`providersPerApp` будь-де в застосунку. Кількість цих інжекторів дорівнює кількості одночасних
HTTP-запитів, що обробляються у заданий проміжок часу.

Кожен інжектор спочатку проглядає те, що у нього запитують, у своєму масиві. Якщо він це не
знаходить, він може звернутись до батьківського інжектора, що знаходиться на рівень вище, якщо
такий існує. А батьківський інжектор, у свою чергу, може піднятись ще вище, аж поки не знайде
потрібне, в противному разі DI кидає помилку.

Щоб зрозуміти, що це означає на практиці, давайте розглянемо конкретний приклад.

Припустимо ви створили `ErrorHandlerService` і думаєте: "Де б його оголосити? - Раз цей сервіс
може знадобитись у будь-якій точці застосунку, значить треба оголосити його саме на рівні
застосунку, тобто в масиві `providersPerApp`". Але при цьому, в даному сервісі ви хочете бачити
інстанси класу `Request` та `Response`:

```ts
import { Injectable } from '@ts-stack/di';
import { Logger, Request, Response, ControllerErrorHandler } from '@ts-stack/ditsmod';

@Injectable()
export class ErrorHandlerService implements ControllerErrorHandler {
  constructor(
    private req: Request,
    private res: Response,
    private log: Logger
  ) {}

  handleError(err: Error) {
    // Тут код для обробки помилки
  }
}
```

Ви запускаєте застосунок, і коли справа доходить до роботи цього сервісу, DI кидає помилку,
бо він не може знайти провайдера для `Request` та `Response`. Але чому? Може їх треба самостійно
оголосити на рівні HTTP-запиту, тобто додати їх у масив `providersPerReq`? Ви так і робите, але
DI все-одно кидає помилку...

Причина криїться у невірно оголошеному рівні для `ErrorHandlerService`.
Оскільки ви оголосили його на рівні застосунку, ним буде опікуватись інжектор на рівні
застосунку, а це означає, що він бачить лише провайдери, оголошені на рівні застосунку. В той же
час, `Request` та `Response` оголошені на рівні запиту, і саме тому їх не бачить вищий у
ієрархії інжектор.

Тепер, якщо ви оголосите `ErrorHandlerService` на рівні запиту, DI не кидатиме помилки. Щоправда,
видимість `ErrorHandlerService` буде обмежуватись лише тим модулем, де ви оголосили цей
провайдер. Як правильно оголосити обробника помилок для контролера, прогляньте
[репозиторій ditsmod-seed][14].

### Токени DI

Інжектор, в якості ключів для пошуку провайдерів, використовує так звані токени. Тип токена може
бути або класом, або об'єктом, або рядком (тобто `string`), або JavaScript-символом
(тобто `symbol`). У якості токена не можуть бути інтерфейси чи типи, що оголошені з
ключовим словом `type`, оскільки після їх компіляції із TypeScript у JavaScript, від них нічого
не залишиться у JavaScript-файлах.

Разом із тим, у конструкторі, в якості токена, найпростіше указати клас певного сервісу:

```ts
import { Injectable } from '@ts-stack/di';

import { SecondService } from './second.service';

@Injectable()
export class FirstService {
  constructor(private secondService: SecondService) {}

  methodOne() {
    this.secondService.doSomeThing();
  }
}
```

DI проглядатиме конструктор, знайде `SecondService`, після чого у відповідних інжекторах шукатиме
провайдера по цьому класу. Тут варто звернути увагу, що DI у якості токена використає саме клас,
а не назву класу.

Для токенів інших типів, в конструкторі необхідно використовувати
декоратор `Inject` перед модифікаторами доступу. Накриклад, у якості токена ви можете
використовувати рядок `tokenForLocal`:

```ts
import { Injectable, Inject } from '@ts-stack/di';

@Injectable()
export class SomeService {
  constructor(@Inject('tokenForLocal') private local: string) {}

  methodOne() {
    this.local;
  }
}
```

В такому разі, щоб DI зміг знайти відповідний провайдер, вам необхідно оголошувати цей провайдер
із таким же токеном:

```ts
import { Module } from '@ts-stack/ditsmod';

@Module({
  providersPerMod: [
    { provide: 'tokenForLocal', useValue: 'uk' }
  ]
})
export class SomeModule {}
```

Зверніть увагу, що при оголошенні провайдера, використовується властивість `useValue`. В такому
разі DI не буде намагатись створити інстанс класу, а видасть без змін те значення, що ви
передали.

**Зауваження** У якості токена для DI рекомендується використовувати саме класи, де тільки це
можливо. Досить рідко може знадобитись використовувати токени інших типів.

### InjectionToken

Окрім можливості використання токенів, що мають різні типи даних, DI має спеціальний клас,
рекомендований для створення токенів - `InjectionToken`. Оскільки він має параметр для типу
(дженерік), ви зможете прочитати тип даних, що буде повертати DI, при запиті конкретного токена:

```ts
import { InjectionToken } from '@ts-stack/di';

export const localToken = new InjectionToken<string>('tokenForLocal');
```

Користуватись ним можна точно так само, як і усіма іншими токенами, що не є класами.
В конструкторі:

```ts
import { Injectable, Inject } from '@ts-stack/di';

import { localToken } from './tokens';

@Injectable()
export class SomeService {
  constructor(@Inject(localToken) private local: string) {}

  methodOne() {
    this.local;
  }
}
```

При оголошенні рівня провайдера:
```ts
import { localToken } from './tokens';

@Module({
  providersPerMod: [
    { provide: localToken, useValue: 'uk' }
  ]
})
export class SomeModule {}
```

Зверніть увагу, що `InjectionToken` імпортується з `@ts-stack/di`, а не з `@ts-stack/ditsmod`.

## Непередбачувана пріоритетність провайдерів

Уявіть, що у вас є `Module1`, куди ви імпортували `Module2` та `Module3`. Ви зробили
такий імпорт, бо вам потрібні `Service2` та `Service3` із цих модулів. Ви проглядаєте результат
роботи даних сервісів, але по якійсь причині `Service3` працює не так як очікується. Ви починаєте
дебажити, чому так відбувається, і виявляється, що `Service3` експортують обидва модулі:
`Module2` та `Module3`. Ви очікували, що `Service3` буде мати поведінку таку, як задокументовано
у `Module3`, але насправді спрацювала та версія, що експортується із `Module2`.

Щоб цього не сталось, якщо ви імпортуєте два або більше модулі, в яких експортуються провайдери
з однаковим токеном, Ditsmod кидатиме помилку `Unpredictable priority` (Непередбачувана
пріоритетність).

Даної помилки можна уникнути, якщо оголосити **рівень** провайдера із цим же токеном в тому
модулі, де сталась дана помилка.

## Домовленості по стилю коду

Тут наводиться рекомендований формат у вигляді пари "назва файлу" - "ім'я класу":

- `hello-world.controller` - `HelloWorldController`;
- `hello-world.service` - `HelloWorldService`;
- `hello-world.module` - `HelloWorldModule`;
- `auth.guard` - `AuthGuard`;

Кореневий модуль рекомендується називати `AppModule`.

При імпорті рекомендується не змішувати імпорт з локальних файлів та імпорт з `node_modules`.
Вгорі йдуть імпорти з `node_modules`, через один рядок йдуть локальні імпорти:

```ts
import { Injectable } from '@ts-stack/di';
import { CanActivate, Status } from '@ts-stack/ditsmod';

import { AuthService } from './auth.service';
import { Permission } from './permission';
```

## API

### AppFactory

```ts
class AppFactory {
  bootstrap(appModule: ModuleType): Promise<{ server: Server; log: Logger }>;
}
```

Під час роботи методу `bootstrap()`:
1. відбувається читання конфігурації із метаданих, закріплених за різними декораторами затосунку
(`RootModule()`, `Module()`, `Controller()`, `Route()` і т.д.);
2. відбувається валідація та злиття даної конфігурації із початковими (default) значеннями
застосунку;
3. враховуючи модульність та ієрархію вказану у конфігурації, готуються інжектори з різними
наборами сервісів;

### ControllerErrorHandler

```ts
class ControllerErrorHandler {
  handleError(error: any): void;
}
```

Даний клас використовується у якості провайдера, а також як інтерфейс для обробника помилок, що
стались у контролері. У якості провайдера його оголошено на рівні HTTP-запиту.

Приклад впровадження `ControllerErrorHandler`:

```ts
import { Injectable } from '@ts-stack/di';
import { Logger, Status, Request, Response, ControllerErrorHandler } from '@ts-stack/ditsmod';

@Injectable()
export class ErrorHandler implements ControllerErrorHandler {
  constructor(private req: Request, private res: Response, private log: Logger) {}

  handleError(err: Error) {
    const req = this.req;
    const message = err.message;
    this.log.error({ err, req });
    if (!this.res.nodeRes.headersSent) {
      this.res.sendJson({ error: { message } }, Status.INTERNAL_SERVER_ERROR);
    }
  }
}
```

Тепер можна [підмінити][116] початковий провайдер даним провайдером.

### BodyParserConfig

```ts
class BodyParserConfig {
  acceptMethods: HttpMethod[];
  maxBodySize: number;
  multipartOpts: MultipartBodyParserOptions;
}
```

Див. також [Автоматичний парсинг тіла HTTP-запиту][115].

### PreRequest

```ts
class PreRequest {
  constructor(protected log: Logger) {}

  /**
   * Called by the `ModuleFactory` before call a router.
   */
  decodeUrl(url: string): string;

  /**
   * Called by the `ModuleFactory` when a route is not found (404).
   */
  sendNotFound(nodeRes: NodeResponse): void;

  /**
   * Logs an error and sends the user message about an internal server error (500).
   *
   * @param err An error to logs it (not sends).
   */
  sendInternalServerError(nodeRes: NodeResponse, err: Error): void;

  /**
   * Logs an error and sends the user message about a bad request error (400).
   *
   * @param err An error to logs it (not sends).
   */
  sendBadRequestError(nodeRes: NodeResponse, err: Error): void;

  canNotActivateRoute(nodeReq: NodeRequest, nodeRes: NodeResponse, status?: Status): void;
}
```

Даний клас використовується у якості провайдера, а також як інтерфейс. У якості
провайдера його оголошено на рівні застосунку.

Його методи працюють перед викликом роутера. Ви можете підмінити даний провайдер, надавши власне
впровадження інтерфейсу `PreRequest`.

### Logger

```ts
class Logger {
  trace: LoggerMethod;
  debug: LoggerMethod;
  info: LoggerMethod;
  warn: LoggerMethod;
  error: LoggerMethod;
  fatal: LoggerMethod;
}
```

Даний клас використовується у якості провайдера, а також як інтерфейс для логера. У якості
провайдера його оголошено на рівні застосунку.

Приклад впровадження `Logger`:

```ts
import { Injectable } from '@ts-stack/di';
import { Logger } from '@ts-stack/ditsmod';

@Injectable()
export class LoggerService extends Logger {
  trace = (...args: any[]): any => {
    if (!args.length) {
      return true;
    }
    console.log('Log trace --->', ...args);
  };

  info = (...args: any[]): any => {
    console.log('Log info --->', ...args);
  };

  debug = (...args: any[]): any => {
    console.log('Log debug --->', ...args);
  };

  warn = (...args: any[]): any => {
    console.log('Log warn --->', ...args);
  };

  fatal = (...args: any[]): any => {
    console.log('Log fatal --->', ...args);
  };
}
```

Тепер можна [підмінити][116] початковий провайдер даним провайдером.

### LoggerMethod

```ts
interface LoggerMethod {
  /**
   * Is the log.<level>() enabled?
    */
   (): boolean;
  /**
   * Log a simple string message (or number).
   */
  (msg: string | number): void;
  /**
   * Special case to log an `Error` instance to the record.
   * This adds an `err` field with exception details
   * (including the stack) and sets `msg` to the exception
   * message or you can specify the `msg`.
   */
  (error: Error, msg?: string, ...params: any[]): void;
  /**
   * The first field can optionally be a `fields` object, which
   * is merged into the log record.
   *
   * To pass in an Error *and* other fields, use the `err`
   * field name for the Error instance.
   */
  (obj: object, msg?: string, ...params: any[]): void;
  /**
   * Uses `util.format` for msg formatting.
   */
  (format: any, ...params: any[]): void;
}
```

### Router

```ts
class Router {
  on(method: HttpMethod, path: string, handle: RouteHandler): this;

  all(path: string, handle: RouteHandler): this;

  find(method: HttpMethod, path: string): RouterReturns;
}
```

### RouterReturns

```ts
class RouterReturns {
  handle: RouteHandler;
  params: RouteParam[];
}
```

### RouteHandler

```ts
type RouteHandler = () => {
  /**
   * Injector per module.
   */
  injector: ReflectiveInjector;
  /**
   * Resolved providers per request.
   */
  providers: ResolvedReflectiveProvider[];
  controller: TypeProvider;
  /**
   * Method of the class controller.
   */
  method: string;
  /**
   * Need or not to parse body.
   */
  parseBody: boolean;
  /**
   * An array of DI tokens used to look up `CanActivate()` handlers,
   * in order to determine if the current user is allowed to activate the controller.
   * By default, any user can activate.
   */
  guardItems: GuardItems[];
};
```

### GuardItems

```ts
interface GuardItems {
  guard: Type<CanActivate>;
  params?: any[];
}
```

### RouteParam

```ts
interface RouteParam {
  key: string;
  value: string;
}
```

### BodyParser

```ts
class BodyParser {
  getRawBody(): Promise<Buffer>;
  getJsonBody(): Promise<any>;
}
```

Даний клас використовується у якості провайдера, а також як інтерфейс для парсера тіла HTTP-запиту.
У якості провайдера його оголошено на рівні HTTP-запиту.

### Request

```ts
class Request {
  /**
   * Object with path params.
   * For example, route `/api/resource/:param1/:param2` have two params.
   */
  pathParams?: any;
  /**
   * Array with path params.
   * For example, route `/api/resource/:param1/:param2` have two params.
   */
  pathParamsArr?: RouteParam[];
  /**
   * This value is set after checking `guard.canActivate()` and before parse the request body.
   * Here is the result of the `querystring.parse()` function,
   * so if query params are missing, there will be an empty object.
   */
  queryParams?: any;
  rawBody?: any;
  /**
   * This value is set after checking `guard.canActivate()` and seting `queryParams`.
   */
  body?: any;

  readonly nodeReq: NodeRequest,
  readonly nodeRes: NodeResponse,
  injector: Injector;

  /**
   * Called by the `ModuleFactory` after founded a route.
   *
   * @param controller Controller class.
   * @param method Method of the Controller.
   * @param parseBody Need or not to parsing a body request.
   */
  async handleRoute(
    controller: TypeProvider,
    method: string,
    pathParamsArr: RouteParam[],
    queryString: string,
    parseBody: boolean,
    guardItems: GuardItems[]
  ): Promise<void>;

  /**
   * Check if the request is idempotent.
   */
  isIdempotent(): boolean

  toString(): string;
}
```

### Response

```ts
class Response<T = any> {
  readonly nodeRes: NodeResponse;

  /**
   * Setting value to the response header `Content-Type`.
   *
   * @example
   *
   * res.setContentType('application/xml').send({ one: 1, two: 2 });
   */
  setContentType(contentType: string): this;

  /**
   * Send data as is, without any transformation.
   */
  send(data?: string | Buffer | Uint8Array, statusCode: Status): void;

  /**
   * To convert `any` type to `string` type, the `util.format()` function is used here.
   */
  sendText(data?: any, statusCode: Status): void;

  sendJson(data?: T, statusCode: Status): void;

  redirect(statusCode: RedirectStatusCodes, path: string): void;

  toString(): string;
}
```

### NodeRequest

```ts
type NodeRequest = http.IncomingMessage | http2.Http2ServerRequest;
```

### NodeResponse

```ts
type NodeResponse = http.ServerResponse | http2.Http2ServerResponse;
```


[1]: https://github.com/ts-stack/di
[2]: https://github.com/ts-stack/ditsmod-seed
[3]: https://github.com/ts-stack/ditsmod
[4]: https://github.com/ts-stack/ditsmod/tree/master/examples
[5]: https://raw.githubusercontent.com/ts-stack/vs-webframework/master/req-per-sec-frameworks.png
[6]: https://github.com/nestjsx/nest-router
[8]: https://uk.wikipedia.org/wiki/%D0%92%D0%BF%D1%80%D0%BE%D0%B2%D0%B0%D0%B4%D0%B6%D0%B5%D0%BD%D0%BD%D1%8F_%D0%B7%D0%B0%D0%BB%D0%B5%D0%B6%D0%BD%D0%BE%D1%81%D1%82%D0%B5%D0%B9
[9]: https://github.com/angular/angular
[10]: https://jestjs.io/en/
[11]: https://github.com/ts-stack/di
[12]: https://uk.wikipedia.org/wiki/%D0%9E%D0%B4%D0%B8%D0%BD%D0%B0%D0%BA_(%D1%88%D0%B0%D0%B1%D0%BB%D0%BE%D0%BD_%D0%BF%D1%80%D0%BE%D1%94%D0%BA%D1%82%D1%83%D0%B2%D0%B0%D0%BD%D0%BD%D1%8F) "Singleton"
[13]: https://developer.mozilla.org/uk/docs/Web/JavaScript/Memory_Management#%D0%B7%D0%B1%D0%B8%D1%80%D0%B0%D0%BD%D0%BD%D1%8F_%D1%81%D0%BC%D1%96%D1%82%D1%82%D1%8F "Garbage collection"
[14]: https://github.com/ts-stack/ditsmod-seed/blob/901f247/src/app/app.module.ts#L18

[100]: #оголошення-рівня-провайдерів-та-підміна-провайдерів
[101]: #експорт-провайдерів-у-звичайному-модулі
[102]: #кореневий-модуль-ditsmod
[103]: #контролер
[104]: #сервіс
[105]: #впровадження-залежностей
[106]: #-
[107]: #експорт-провайдерів-зі-звичайного-модуля
[108]: #експорт-провайдерів-із-кореневого-модуля
[109]: #імпорт-модуля
[110]: #реекспорт-модуля
[111]: #оголошення-контролера
[112]: #префікси-маршрутів
[113]: #guards
[114]: #параметри-для-guards
[115]: #автоматичний-парсинг-тіла-http-запиту
[116]: #підміна-by-default-класів-ditsmod
[117]: #різниця-між-областю-видимості-провайдерів-та-їх-рівнями-оголошення
[118]: #інжектори-di
[119]: #токени-di
[120]: #injectiontoken
[121]: #непередбачувана-пріоритетність-провайдерів
[122]: #домовленості-по-стилю-коду
[123]: #вхідний-файл-для-node.js
[124]: #controllererrorhandler
[125]: #logger
[126]: #імпорт-модуля
[127]: #пріоритетність-провайдерів
[128]: #bodyparserconfig
[129]: #prerequest
[130]: #loger
[131]: #router
[132]: #bodyparser
[133]: #request
[134]: #response