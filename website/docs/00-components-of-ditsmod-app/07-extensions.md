---
sidebar_position: 7
---

# Розширення

## Що робить розширення Ditsmod

Розширення виконує свою роботу перед створенням обробників HTTP-запитів, і при цьому воно може динамічно додавати [провайдери][9]. Щоб змінити або розширити роботу застосунку, як правило, розширення використовує метадані, закріплені за певними декораторами. Розширення можуть ініціалізуватись асинхронно, і можуть залежати один від одного.

Наприклад, в модулі [@ditsmod/body-parser][5] працює розширення, що динамічно додає HTTP-інтерсептор для парсингу тіла запиту до кожного роута, що має відповідний метод (POST, PATCH, PUT). Воно це робить один раз перед створенням обробників HTTP-запитів, тому за кожним запитом вже немає необхідності тестувати потребу такого парсингу.

Інший приклад. Модуль [@ditsmod/openapi][6] дозволяє створювати OpenAPI-документацію за допомогою власного декоратора `@oasRoute`. Без роботи розширення, Ditsmod буде ігнорувати метадані з цього нового декоратора.

## Що таке "розширення Ditsmod"

У Ditsmod **розширенням** називається клас, що впроваджує інтерфейс `Extension`:

```ts
interface Extension<T> {
  init(isLastExtensionCall: boolean): Promise<T>;
}
```

Кожне розширення потрібно реєструвати, про це буде згадано пізніше, а зараз припустимо, що така реєстрація відбулася, застосунок запущено, після чого йде наступний процес:

1. збираються метадані з усіх декораторів (`@rootModule`, `@featureModule`, `@controller`, `@route`...);
2. зібрані метадані передаються в DI з токеном `MetadataPerMod1`, отже - будь-яке розширення може отримати ці метадані у себе в конструкторі;
3. починається по-модульна робота розширень:
    - у кожному модулі збираються розширення, що створені в цому модулі, або імпортовані в цей модуль;
    - кожне з цих розширень отримує метадані, зібрані теж у цьому модулі, і викликаються методи `init()` даних розширень.
4. створюються обробники HTTP-запитів;
5. застосунок починає працювати у звичному режимі, обробляючи HTTP-запити.

Метод `init()` певного розширення може викликатись стільки разів, скільки разів він прописаний у тілі інших розширень, які залежать від роботи даного розширення, +1. Цю особливість необхідно обов'язково враховувати, щоб не відбувалась зайва ініціалізація:

```ts {9-11}
import { injectable } from '@ditsmod/core';
import { Extension } from '@ditsmod/core';

@injectable()
export class MyExtension implements Extension<void> {
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

Будь-яке розширення повинно входити в одну або декілька груп. Під капотом Ditsmod, групи розширень - це по-суті групи [мульти-провайдерів][7], які, як правило, працюють над одними й тими самими метаданими, та повертають інші метадані, що мають однаковий базовий інтерфейс.

Концепція **груп розширень** була введена для того, щоб:

1. над одними й тими самими метаданими міг працювати набір розширень, причому порядок роботи в межах даного набору є неважливим;
2. була можливість налаштовувати порядок роботи між різними наборами розширень.

Іншими словами, для формування однієї групи розширень, порядок роботи кожного з цих розширень є неважливим. З іншого боку, якщо порядок роботи між різними розширеннями є важливим, варто подумати про рознесення цих розширень у різні групи.

Наприклад, у `@ditsmod/router` існує група `ROUTES_EXTENSIONS` в яку по-дефолту входить єдине розширення, що обробляє метадані, зібрані з декоратора `@route()`. Якщо в якомусь застосунку потрібна документація OpenAPI, можна підключити модуль `@ditsmod/openapi`, де також зареєстровано розширення у групі `ROUTES_EXTENSIONS`, але це розширення працює з декоратором `@oasRoute()`. В такому разі, у групі `ROUTES_EXTENSIONS` вже буде зареєстровано два розширення, кожне з яких готуватиме дані для встановлення маршрутів роутера. Ці розширення зібрані в одну групу, оскільки вони налаштовують роути, і їхні методи `init()` повертають дані з однаковим базовим інтерфейсом.

Єдиний базовий інтерфейс даних, які повертає кожне з розширень у певній групі, - це важлива умова, оскільки інші розширення можуть очікувати дані із цієї групи, і вони будуть опиратись саме на цей базовий інтерфейс. Звичайно ж, базовий інтерфейс при потребі можна розширювати, але не звужувати.

У нашому прикладі, після того, як відпрацюють усі розширення з групи `ROUTES_EXTENSIONS`, їхні дані збираються в один масив і передаються до групи `PRE_ROUTER_EXTENSIONS`. Навіть якщо ви пізніше зареєструєте більше нових розширень у групі `ROUTES_EXTENSIONS`, все-одно група `PRE_ROUTER_EXTENSIONS` буде запускатись після того як відпрацюють абсолютно усі розширення з групи `ROUTES_EXTENSIONS`, включаючи ваші нові розширення.

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
import { InjectionToken } from '@ditsmod/core';
import { Extension } from '@ditsmod/core';

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

import { MY_EXTENSIONS, MyExtension } from './my.extension.js';

@featureModule({
  extensions: [
    { extension: MyExtension, groupToken: MY_EXTENSIONS, nextToken: ROUTES_EXTENSIONS, exported: true }
  ],
})
export class SomeModule {}
```

Тобто у властивість `groupToken` передається токен групи `MY_EXTENSIONS`, до якої належить ваше розширення. У властивість `nextToken` передається токен групи розширень `ROUTES_EXTENSIONS`, перед якою потрібно запускати групу `MY_EXTENSIONS`. Властивість `exported` вказує на те, чи потрібно експортувати дане розширення з поточного модуля.

Якщо ж для вашого розширення не важливо перед якою групою розширень воно працюватиме, можна спростити реєстрацію:

```ts
import { featureModule } from '@ditsmod/core';

import { MY_EXTENSIONS, MyExtension } from './my.extension.js';

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

`ExtensionsManager` буде послідовно викликати ініціалізацію усіх розширень з указаної групи, а результат їхньої роботи повертатиме у вигляді масиву. Якщо розширення повертатимуть масиви, вони будуть автоматично змерджені у єдиний результуючий масив. Цю поведінку можна змінити, якщо другим аргументом у `init()` передати `false`:

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

Кожне розширення може вказати залежність від групи розширень `ROUTES_EXTENSIONS`, щоб динамічно додавати провайдери на рівні:

- модуля,
- роуту,
- запиту.

Можна проглянути як це зроблено у [BodyParserExtension][3]:

```ts
@injectable()
export class BodyParserExtension implements Extension<void> {
  private inited: boolean;

  constructor(protected extensionManager: ExtensionsManager, protected injectorPerApp: InjectorPerApp) {}

  async init() {
    if (this.inited) {
      return;
    }

    // Отримуємо метадані, зібрані за допомогою групи розширень ROUTES_EXTENSIONS
    const aMetadataPerMod2 = await this.extensionManager.init(ROUTES_EXTENSIONS);

    aMetadataPerMod2.forEach((metadataPerMod2) => {
      // Спочатку витягуємо метадані модуля
      const { aControllersMetadata2, providersPerMod } = metadataPerMod2;

      // Тепер витягуємо метадані контролера
      aControllersMetadata2.forEach(({ providersPerRou, providersPerReq }) => {
        // Зливаємо провайдери із модуля та контролера
        const mergedProvidersPerRou = [...metadataPerMod2.providersPerRou, ...providersPerRou];
        const mergedProvidersPerReq = [...metadataPerMod2.providersPerReq, ...providersPerReq];

        // Створюємо ієрархію інжекторів
        const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(providersPerMod);
        const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedProvidersPerRou);
        const injectorPerReq = injectorPerRou.resolveAndCreateChild(mergedProvidersPerReq);

        // Отримуємо метадані для роуту,
        // і на їх основі або додаємо інтерсептор до injectorPerReq, або - ні.
        const routeMeta = injectorPerRou.get(RouteMeta) as RouteMeta;
        const bodyParserConfig = injectorPerReq.resolveAndInstantiate(BodyParserConfig) as BodyParserConfig;
        if (bodyParserConfig.acceptMethods.includes(routeMeta.httpMethod)) {
          providersPerReq.push({ token: HTTP_INTERCEPTORS, useClass: BodyParserInterceptor, multi: true });
        }
      });
    });

    this.inited = true;
  }
}
```

Звичайно ж, таке динамічне додавання провайдерів можливе лише перед створенням обробників HTTP-запитів. Як бачите, у даному прикладі створюється [ієрархія інжекторів][8] для того, щоб отримати правильні дані з токеном `RouteMeta`.

[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/09-one-extension
[3]: https://github.com/ditsmod/ditsmod/blob/0c4660a77/packages/body-parser/src/body-parser.extension.ts#L27-L40
[4]: #реєстрація-розширення-в-групі
[5]: /native-modules/body-parser
[6]: /native-modules/openapi
[7]: /components-of-ditsmod-app/dependency-injection#мульти-провайдери
[8]: /components-of-ditsmod-app/dependency-injection#ієрархія-інжекторів
[9]: /components-of-ditsmod-app/dependency-injection#провайдери
