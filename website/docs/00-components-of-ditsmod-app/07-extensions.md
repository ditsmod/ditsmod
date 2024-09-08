---
sidebar_position: 7
---

# Розширення

## Що робить розширення Ditsmod

Як правило, розширення виконує свою роботу перед створенням обробників HTTP-запитів. Щоб змінити або розширити роботу застосунку розширення використовує статичні метадані, закріплені за певними декораторами. З іншого боку, розширення може ще й динамічно додавати метадані такого самого типу, як і ці статичні метадані. Розширення можуть ініціалізуватись асинхронно, і можуть залежати один від одного.

Задача більшості розширень полягає в тому, що вони, як на конвеєрі, на вході беруть один багатовимірний масив конфігураційних даних (метаданих), а на виході видають інший (або доповнений) багатовимірний масив, який в кінцевому підсумку інтерпретується цільовим розширенням, наприклад, для створенні роутів та їх обробників. Але не обов'язково щоб розширення працювали над конфігурацією та встановленням обробників HTTP-запитів; вони можуть ще й записувати логи чи збирати метрики для моніторингу, або виконувати будь-яку іншу роботу.

У більшості випадків, дані багатовимірні масиви відображають структуру застосунку:

1. вони розбиті по модулям;
2. у кожному модулі є контролери або провайдери;
3. кожен контролер має один або більше роутів.

Наприклад, в модулі [@ditsmod/body-parser][5] працює розширення, що динамічно додає HTTP-інтерсептор для парсингу тіла запиту до кожного роута, що має відповідний метод (POST, PATCH, PUT). Воно це робить один раз перед створенням обробників HTTP-запитів, тому за кожним запитом вже немає необхідності тестувати потребу такого парсингу.

Інший приклад. Модуль [@ditsmod/openapi][6] дозволяє створювати OpenAPI-документацію за допомогою власного декоратора `@oasRoute`. Без роботи розширення, Ditsmod буде ігнорувати метадані з цього нового декоратора. Розширення з цього модуля отримує згаданий вище конфігураційний масив, знаходить там метадані з декоратора `@oasRoute`, й інтерпретує ці метадані додаючи інші метадані, які будуть використовуватись іншим розширенням для встановлення роутів.

## Що таке "розширення Ditsmod"

У Ditsmod **розширенням** називається клас, що впроваджує інтерфейс `Extension`:

```ts
interface Extension<T> {
  init(isLastModule: boolean): Promise<T>;
}
```

Кожне розширення потрібно реєструвати, про це буде згадано пізніше, а зараз припустимо, що така реєстрація відбулася, після чого йде наступний процес:

1. збираються метадані з усіх декораторів (`@rootModule`, `@featureModule`, `@controller`, `@route`...);
2. зібрані метадані передаються в DI з токеном `MetadataPerMod1`, отже - будь-яке розширення може отримати ці метадані у себе в конструкторі;
3. починається по-модульна робота розширень:
    - у кожному модулі збираються розширення, що створені в цому модулі, або імпортовані в цей модуль;
    - кожне з цих розширень отримує метадані, зібрані теж у цьому модулі, і викликаються методи `init()` даних розширень.
4. створюються обробники HTTP-запитів;
5. застосунок починає працювати у звичному режимі, обробляючи HTTP-запити.

Метод `init()` певного розширення може викликатись стільки разів, скільки разів він прописаний у тілі інших розширень, які залежать від роботи даного розширення, +1. Цю особливість необхідно обов'язково враховувати, щоб не відбувалась зайва ініціалізація:

```ts {8-10}
import { injectable, Extension } from '@ditsmod/core';

@injectable()
export class MyExtension implements Extension<any> {
  private data: any;

  async init() {
    if (this.data) {
      return this.data;
    }

    // ...
    // Щось хороше робите
    // ...

    this.data = result;
    return this.data;
  }
}
```

Готовий простий приклад ви можете проглянути у теці [09-one-extension][1].

## Групи розширень

Будь-яке розширення повинно входити в одну або декілька груп. Концепція **групи розширень** аналогічна до концепції групи [інтерсепторів][10]. Зверніть увагу, що група інтерсепторів виконує конкретний вид робіт: доповнення обробки HTTP-запиту для певного роута. Аналогічно, кожна група розширень - це окремий вид робіт над певними метаданими. Як правило, розширення в певній групі повертають метадані, що мають однаковий базовий інтерфейс. По-суті, групи розширень дозволяють абстрагуватись від конкретних розширень; натомість вони роблять важливими лише вид роботи, який виконується у даних групах.

Наприклад, у `@ditsmod/routing` існує група `ROUTES_EXTENSIONS` в яку по-дефолту входить єдине розширення, що обробляє метадані, зібрані з декоратора `@route()`. Якщо в якомусь застосунку потрібна документація OpenAPI, можна підключити модуль `@ditsmod/openapi`, де також зареєстровано розширення у групі `ROUTES_EXTENSIONS`, але це розширення працює з декоратором `@oasRoute()`. В такому разі, у групі `ROUTES_EXTENSIONS` вже буде зареєстровано два розширення, кожне з яких готуватиме дані для встановлення маршрутів роутера. Ці розширення зібрані в одну групу, оскільки вони налаштовують роути, а їхні методи `init()` повертають дані з однаковим базовим інтерфейсом.

Спільний базовий інтерфейс даних, який повертає кожне з розширень у певній групі, - це важлива умова, оскільки інші розширення можуть очікувати дані із цієї групи, і вони будуть опиратись саме на цей базовий інтерфейс. Звичайно ж, базовий інтерфейс при потребі можна розширювати, але не звужувати.

Окрім спільного базового інтерфейсу, важливою є також послідовність запуску груп розширень і залежність між ними. У нашому прикладі, після того, як відпрацюють усі розширення з групи `ROUTES_EXTENSIONS`, їхні дані збираються в один масив і передаються до групи `PRE_ROUTER_EXTENSIONS`. Навіть якщо ви пізніше зареєструєте більше нових розширень у групі `ROUTES_EXTENSIONS`, все-одно група `PRE_ROUTER_EXTENSIONS` буде запускатись після того як відпрацюють абсолютно усі розширення з групи `ROUTES_EXTENSIONS`, включаючи ваші нові розширення.

Ця фіча є дуже зручною, оскільки вона інколи дозволяє інтегрувати зовнішні модулі Ditsmod (наприклад, з npmjs.com) у ваш застосунок без жодних налаштувань, просто імпортувавши їх у потрібний модуль. Саме завдяки групам розширень, імпортовані розширення будуть запускатись у правильній послідовності, навіть якщо вони імпортовані з різних зовнішніх модулів.

Так працює, наприклад, розширення з `@ditsmod/body-parser`. Ви просто імпортуєте `BodyParserModule`, і його розширення вже буде запускатись у правильному порядку, який прописаний у цьому модулі. В даному разі, його розширення буде працювати після групи `ROUTES_EXTENSIONS`, але перед групою `PRE_ROUTER_EXTENSIONS`. Причому зверніть увагу, що `BodyParserModule` і гадки не має, які саме розширення будуть працювати у цих групах, для нього важливим є лише:

1. інтерфейс даних, який будуть повертати розширення з групи `ROUTES_EXTENSIONS`;
2. порядок запуску, щоб роути не були встановлені ще до роботи цього модуля (тобто щоб група `PRE_ROUTER_EXTENSIONS` працювала саме після нього, а не перед ним).

Це означає, що `BodyParserModule` буде брати до уваги роути, що встановлені за допомогою декораторів `@route()` або `@oasRoute()`, або будь-яких інших декораторів із цієї групи, оскільки їх обробкою займаються розширення, що працюють перед ним у групі `ROUTES_EXTENSIONS`.

## Реєстрація розширення

[Зареєструйте розширення][4] в існуючій групі розширень, або створіть нову групу, навіть якщо у ній буде єдине розширення. Для нової групи вам потрібно буде створити новий DI токен.

### Створення токена нової групи

Токен групи розширень повинен бути інстансом класу `InjectionToken`.

Наприклад, щоб створити токен для групи `MY_EXTENSIONS`, необхідно зробити наступне:

```ts
import { InjectionToken, Extension } from '@ditsmod/core';

export const MY_EXTENSIONS = new InjectionToken<Extension<void>[]>('MY_EXTENSIONS');
```

Як бачите, кожна група розширень повинна указувати, що DI повертатиме масив інстансів розширень: `Extension<void>[]`. Це треба робити обов'язково, відмінність може бути хіба що в типі даних для дженеріка `Extension<T>[]`.

### Реєстрація розширення в групі

В масив `extensions`, що знаходиться в метаданих модуля, можуть передаватись об'єкти наступного типу:

```ts
export class ExtensionOptions {
  extension: ExtensionType;
  groupToken: InjectionToken<Extension<any>[]>;
  /**
   * The token of the group before which this extension will be called.
   */
  nextToken?: InjectionToken<Extension<any>[]>;
  /**
   * Indicates whether this extension needs to be exported.
   */
  exported?: boolean;
}
```

Властивість `nextToken` використовується, коли вашу групу розширень потрібно запускати перед іншою групою розширень:

```ts
import { featureModule, ROUTES_EXTENSIONS } from '@ditsmod/core';
import { MyExtension, MY_EXTENSIONS } from './my.extension.js';

@featureModule({
  extensions: [
    { extension: MyExtension, groupToken: MY_EXTENSIONS, nextToken: ROUTES_EXTENSIONS, exported: true }
  ],
})
export class SomeModule {}
```

Тобто у властивість `groupToken` передається токен групи `MY_EXTENSIONS`, до якої належить ваше розширення. У властивість `nextToken` передається токен групи розширень `ROUTES_EXTENSIONS`, перед якою потрібно запускати групу `MY_EXTENSIONS`. Властивість `exported` вказує на те, чи потрібно щоб дане розширення працювало у зовнішньому модулі, яке імпортуватиме цей модуль.

Якщо ж для вашого розширення не важливо перед якою групою розширень воно працюватиме, можна спростити реєстрацію:

```ts
import { featureModule } from '@ditsmod/core';
import { MyExtension, MY_EXTENSIONS } from './my.extension.js';

@featureModule({
  extensions: [
    { extension: MyExtension, groupToken: MY_EXTENSIONS, exported: true }
  ],
})
export class SomeModule {}
```

## Використання ExtensionsManager

Якщо певне розширення має залежність від іншого розширення, рекомендується вказувати таку залежність посередньо через групу розширень. Для цього вам знадобиться `ExtensionsManager`, який ініціалізує групи розширень, кидає помилки про циклічні залежності між розширеннями, і показує весь ланцюжок розширень, що призвів до зациклення. Окрім цього, `ExtensionsManager` дозволяє збирати результати ініціалізації розширень з усього застосунку, а не лише з одного модуля.

Припустимо `MyExtension` повинно дочекатись завершення ініціалізації групи `OTHER_EXTENSIONS`. Щоб зробити це, у конструкторі треба указувати залежність від `ExtensionsManager`, а у `init()` викликати `init()` цього сервісу:

```ts {17}
import { injectable } from '@ditsmod/core';
import { Extension, ExtensionsManager } from '@ditsmod/core';

import { OTHER_EXTENSIONS } from './other.extensions.js';

@injectable()
export class MyExtension implements Extension<void> {
  private inited: boolean;

  constructor(private extensionsManager: ExtensionsManager) {}

  async init() {
    if (this.inited) {
      return;
    }

    const result = await this.extensionsManager.init(OTHER_EXTENSIONS);
    // Do something here.
    this.inited = true;
  }
}
```

`ExtensionsManager` буде послідовно викликати ініціалізацію усіх розширень з указаної групи, а результат їхньої роботи повертатиме у вигляді масиву. Якщо розширення повертатимуть масиви, вони будуть автоматично злиті у єдиний результуючий масив. Цю поведінку можна змінити, якщо другим аргументом у `init()` передати `false`:

```ts
await this.extensionsManager.init(OTHER_EXTENSIONS, false);
```

Важливо пам'ятати, що запуск `init()` певного розширення обробляє дані лише в контексті поточного модуля. Наприклад, якщо `MyExtension` імпортовано у три різні модулі, то Ditsmod буде послідовно обробляти ці три модулі із трьома різними інстансами `MyExtension`. Це означає, що один інстанс розширення зможе збирати дані лише з одного модуля.

У випадку, коли вам потрібно накопичувати результати роботи певного розширення з усіх модулів, необхідно робити наступне:

```ts {17-20}
import { injectable } from '@ditsmod/core';
import { Extension, ExtensionsManager } from '@ditsmod/core';

import { OTHER_EXTENSIONS } from './other.extensions.js';

@injectable()
export class MyExtension implements Extension<void | false> {
  private inited: boolean;

  constructor(private extensionsManager: ExtensionsManager) {}

  async init() {
    if (this.inited) {
      return;
    }

    const result = await this.extensionsManager.init(OTHER_EXTENSIONS, true, MyExtension);
    if (!result) {
      return false;
    }

    // Do something here.
    this.inited = true;
  }
}
```

Тобто коли вам потрібно щоб `MyExtension` отримало дані з групи `OTHER_EXTENSIONS` з усього застосунку, третім аргументом тут потрібно передавати `MyExtension`:

```ts
const result = await this.extensionsManager.init(OTHER_EXTENSIONS, true, MyExtension);
```

Даний вираз буде повертати `false` до того часу, поки не буде викликано останній раз групу `OTHER_EXTENSIONS`. Наприклад, якщо група `OTHER_EXTENSIONS` працює у трьох різних модулях, то цей вираз у перших двох модулях повертатиме `false`, а у третьому - те значення, яке повинно повертати ця група розширень.

## Динамічне додавання провайдерів

Будь-яке розширення може вказати залежність від групи розширень `ROUTES_EXTENSIONS`, щоб динамічно додавати провайдери на будь-якому рівні. Розширення з цієї групи використовують метадані з інтерфейсом `MetadataPerMod1` і повертають метадані з інтерфейсом `MetadataPerMod2`.

Можна проглянути як це зроблено у [BodyParserExtension][3]:

```ts {12,28}
@injectable()
export class BodyParserExtension implements Extension<void> {
  private inited: boolean;

  constructor(protected extensionManager: ExtensionsManager, protected perAppService: PerAppService) {}

  async init() {
    if (this.inited) {
      return;
    }

    const aMetadataPerMod2 = await this.extensionManager.init(ROUTES_EXTENSIONS);
    aMetadataPerMod2.forEach((metadataPerMod2) => {
      const { aControllersMetadata2, providersPerMod } = metadataPerMod2;
      aControllersMetadata2.forEach(({ providersPerRou, providersPerReq, httpMethod }) => {
        // Зливаємо провайдери із модуля та контролера
        const mergedProvidersPerRou = [...metadataPerMod2.providersPerRou, ...providersPerRou];
        const mergedProvidersPerReq = [...metadataPerMod2.providersPerReq, ...providersPerReq];

        // Створюємо ієрархію інжекторів
        const injectorPerApp = this.perAppService.injector;
        const injectorPerMod = injectorPerApp.resolveAndCreateChild(providersPerMod);
        const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedProvidersPerRou);
        const injectorPerReq = injectorPerRou.resolveAndCreateChild(mergedProvidersPerReq);
        let bodyParserConfig = injectorPerReq.get(BodyParserConfig, undefined, {}) as BodyParserConfig;
        bodyParserConfig = Object.assign({}, new BodyParserConfig(), bodyParserConfig); // Merge with default.
        if (bodyParserConfig.acceptMethods?.includes(httpMethod)) {
          providersPerReq.push({ token: HTTP_INTERCEPTORS, useClass: BodyParserInterceptor, multi: true });
        }
      });
    });

    this.inited = true;
  }
}
```

В даному разі, HTTP-інтерсептор додається в масив `providersPerReq`, у метадані контролера. Але перед цим, створюється [ієрархія інжекторів][8] для того, щоб отримати певну конфігурацію, яка вказує нам чи потрібно додавати такий інтерсептор. Якщо б не потрібно було перевіряти будь-яку умову, ми могли б не створювати ієрархії інжекторів, і зразу б додали інтерсептор на рівні запиту.

Звичайно ж, таке динамічне додавання провайдерів можливе лише перед створенням обробників HTTP-запитів.

[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/09-one-extension
[3]: https://github.com/ditsmod/ditsmod/blob/body-parser-2.16.0/packages/body-parser/src/body-parser.extension.ts#L54
[4]: #реєстрація-розширення-в-групі
[5]: /native-modules/body-parser
[6]: /native-modules/openapi
[7]: /components-of-ditsmod-app/dependency-injection#мульти-провайдери
[8]: /components-of-ditsmod-app/dependency-injection#ієрархія-інжекторів
[9]: /components-of-ditsmod-app/dependency-injection#провайдери
[10]: /components-of-ditsmod-app/http-interceptors/
