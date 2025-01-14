---
sidebar_position: 7
---

# Розширення

## Що робить розширення Ditsmod

Як правило, розширення виконує свою роботу перед створенням обробників HTTP-запитів. Щоб змінити або розширити роботу застосунку, розширення використовує статичні метадані, що закріплені за певними декораторами. З іншого боку, розширення може ще й динамічно додавати метадані такого самого типу, як і ці статичні метадані. Розширення можуть ініціалізуватись асинхронно, і можуть залежати один від одного.

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
  stage1(isLastModule: boolean): Promise<T>;
}
```

Кожне розширення потрібно реєструвати, про це буде згадано пізніше, а зараз припустимо, що така реєстрація відбулася, після чого йде наступний процес:

1. збираються метадані з усіх декораторів (`@rootModule`, `@featureModule`, `@controller`, `@route`...);
2. зібрані метадані передаються в DI з токеном `MetadataPerMod2`, отже - будь-яке розширення може отримати ці метадані у себе в конструкторі;
3. починається по-модульна робота розширень:
    - у кожному модулі збираються розширення, що створені в цому модулі, або імпортовані в цей модуль;
    - кожне з цих розширень отримує метадані, зібрані теж у цьому модулі, і викликаються методи `stage1()` даних розширень.
4. створюються обробники HTTP-запитів;
5. застосунок починає працювати у звичному режимі, обробляючи HTTP-запити.

Готовий простий приклад ви можете проглянути у теці [09-one-extension][1].

## Групи розширень

Будь-яке розширення повинно входити в одну або декілька груп. Концепція **групи розширень** аналогічна до концепції групи [інтерсепторів][10]. Зверніть увагу, що група інтерсепторів виконує конкретний вид робіт: доповнення обробки HTTP-запиту для певного роута. Аналогічно, кожна група розширень - це окремий вид робіт над певними метаданими. Як правило, розширення в певній групі повертають метадані, що мають однаковий базовий інтерфейс. По-суті, групи розширень дозволяють абстрагуватись від конкретних розширень; натомість вони роблять важливими лише вид роботи, який виконується у даних групах.

Наприклад, у `@ditsmod/routing` існує група `ROUTES_EXTENSIONS` в яку по-дефолту входить єдине розширення, що обробляє метадані, зібрані з декоратора `@route()`. Якщо в якомусь застосунку потрібна документація OpenAPI, можна підключити модуль `@ditsmod/openapi`, де також зареєстровано розширення у групі `ROUTES_EXTENSIONS`, але це розширення працює з декоратором `@oasRoute()`. В такому разі, у групі `ROUTES_EXTENSIONS` вже буде зареєстровано два розширення, кожне з яких готуватиме дані для встановлення маршрутів роутера. Ці розширення зібрані в одну групу, оскільки вони налаштовують роути, а їхні методи `stage1()` повертають дані з однаковим базовим інтерфейсом.

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

### Реєстрація розширення у групі

В масив `extensions`, що знаходиться в метаданих модуля, можуть передаватись об'єкти наступного типу:

```ts
class ExtensionConfig {
  extension: ExtensionType;
  /**
   * The token of the group after which this extension will be called.
   */
  afterExtensions?: ExtensionType[]>;
  /**
   * The token of the group before which this extension will be called.
   */
  beforeExtensions?: ExtensionType[]>;
  /**
   * Indicates whether this extension needs to be exported.
   */
  export?: boolean;
  /**
   * Indicates whether this extension needs to be exported without working in host module.
   */
  exportOnly?: boolean;
}
```

Властивість `beforeExtensions` використовується, коли вашу групу розширень потрібно запускати перед іншою групою розширень:

```ts
import { featureModule, ROUTES_EXTENSIONS } from '@ditsmod/core';
import { MyExtension, MY_EXTENSIONS } from './my.extension.js';

@featureModule({
  extensions: [
    { extension: MyExtension, group: MY_EXTENSIONS, beforeExtensions: [ROUTES_EXTENSIONS], export: true }
  ],
})
export class SomeModule {}
```

Тобто у властивість `token` передається токен групи `MY_EXTENSIONS`, до якої належить ваше розширення. У властивість `beforeExtensions` передається токен групи розширень `ROUTES_EXTENSIONS`, перед якою потрібно запускати групу `MY_EXTENSIONS`. Опціонально можна використовувати властивість `exported` або `exportOnly` для того, щоб вказати, чи потрібно щоб дане розширення працювало у зовнішньому модулі, яке імпортуватиме цей модуль. Окрім цього, властивість `exportOnly` ще й вказує на те, що дане розширення не потрібно запускати у так званому хост-модулі (тобто в модулі, де оголошується це розширення).

## Використання ExtensionsManager

Якщо певне розширення має залежність від іншого розширення, рекомендується вказувати таку залежність посередньо через групу розширень. Для цього вам знадобиться `ExtensionsManager`, який ініціалізує групи розширень, кидає помилки про циклічні залежності між розширеннями, і показує весь ланцюжок розширень, що призвів до зациклення. Окрім цього, `ExtensionsManager` дозволяє збирати результати ініціалізації розширень з усього застосунку, а не лише з одного модуля.

Припустимо `MyExtension` повинно дочекатись завершення ініціалізації групи `OTHER_EXTENSIONS`. Щоб зробити це, у конструкторі треба указувати залежність від `ExtensionsManager`, а у `stage1()` викликати `stage1()` цього сервісу:

```ts {11}
import { injectable } from '@ditsmod/core';
import { Extension, ExtensionsManager } from '@ditsmod/core';

import { OTHER_EXTENSIONS } from './other.extensions.js';

@injectable()
export class MyExtension implements Extension<void> {
  constructor(private extensionsManager: ExtensionsManager) {}

  async stage1() {
    const stage1GroupMeta = await this.extensionsManager.stage1(OTHER_EXTENSIONS);

    stage1GroupMeta.groupData.forEach((stage1Meta) => {
      const someData = stage1Meta;
      // Do something here.
      // ...
    });
  }
}
```

`ExtensionsManager` буде послідовно викликати ініціалізацію усіх розширень з указаної групи, а результат їхньої роботи повертатиме в об'єкті, що має наступний інтерфейс:

```ts
interface Stage1GroupMeta<T = any> {
  delay: boolean;
  countdown = 0;
  groupDataPerApp: Stage1GroupMetaPerApp<T>[];
  groupData: T[],
  moduleName: string;
}
```

Якщо властивість `delay == true` - це означає, що властивість `groupDataPerApp` містить дані ще не з усіх модулів, куди імпортовано дану групу розширень (`OTHER_EXTENSIONS`). Властивість `countdown` вказує, у скількох модулях ще залишилось відпрацювати даній групі розширень, щоб властивість `groupDataPerApp` містила дані з усіх модулів. Тобто властивості `delay` та `countdown` стосуються лише властивості `groupDataPerApp`.

У властивості `groupData` знаходиться масив, де зібрані дані з поточного модуля від різних розширень з даної групи розширень.

Важливо пам'ятати, що для кожного модуля створюється окремий інстанс певного розширення. Наприклад, якщо `MyExtension` імпортовано у три різні модулі, то Ditsmod буде послідовно обробляти ці три модулі із трьома різними інстансами `MyExtension`. Окрім цього, якщо `MyExtension` потребує підсумкові дані, наприклад, від групи розширень `OTHER_EXTENSIONS` із чотирьох модулів, а саме `MyExtension` імпортовано лише у три модулі, це означає, що з одного модуля `MyExtension` може і не отримати необхідних даних.

В такому випадку потрібно передавати `this` у якості аргументу для другого параметра методу `extensionsManager.stage1`:

```ts {11}
import { injectable } from '@ditsmod/core';
import { Extension, ExtensionsManager } from '@ditsmod/core';

import { OTHER_EXTENSIONS } from './other.extensions.js';

@injectable()
export class MyExtension implements Extension<void> {
  constructor(private extensionsManager: ExtensionsManager) {}

  async stage1() {
    const stage1GroupMeta = await this.extensionsManager.stage1(OTHER_EXTENSIONS, this);
    if (stage1GroupMeta.delay) {
      return;
    }

    stage1GroupMeta.groupDataPerApp.forEach((totaStage1Meta) => {
      totaStage1Meta.groupData.forEach((metadataPerMod3) => {
        // Do something here.
        // ...
      });
    });
  }
}
```

Тобто коли вам потрібно щоб `MyExtension` отримало дані з групи `OTHER_EXTENSIONS` з усього застосунку, другим аргументом для методу `stage1` потрібно передавати `this`:

```ts
const stage1GroupMeta = await this.extensionsManager.stage1(OTHER_EXTENSIONS, this);
```

В такому разі гарантується, що інстанс `MyExtension` отримає дані з усіх модулів, куди імпортовано `OTHER_EXTENSIONS`. Навіть якщо `MyExtension` буде імпортовано у певний модуль, в якому немає розширень із групи `OTHER_EXTENSIONS`, але ці розширення є в інших модулях, все-одно метод `stage1` даного розширення буде викликано після ініціалізації усіх розширень, тому `MyExtension` отримає дані від `OTHER_EXTENSIONS` з усіх модулів.

## Динамічне додавання провайдерів

Будь-яке розширення може вказати залежність від групи розширень `ROUTES_EXTENSIONS`, щоб динамічно додавати провайдери на будь-якому рівні. Розширення з цієї групи використовують метадані з інтерфейсом `MetadataPerMod2` і повертають метадані з інтерфейсом `MetadataPerMod3`.

Можна проглянути як це зроблено у [BodyParserExtension][3]:

```ts {9,25,32}
@injectable()
export class BodyParserExtension implements Extension<void> {
  constructor(
    protected extensionManager: ExtensionsManager,
    protected perAppService: PerAppService,
  ) {}

  async stage1() {
    const stage1GroupMeta = await this.extensionManager.stage1(ROUTES_EXTENSIONS);
    stage1GroupMeta.groupData.forEach((metadataPerMod3) => {
      const { aControllerMetadata, providersPerMod } = metadataPerMod3;
      aControllerMetadata.forEach(({ providersPerRou, providersPerReq, httpMethod, singleton }) => {
        // Merging the providers from a module and a controller
        const mergedProvidersPerRou = [...metadataPerMod3.providersPerRou, ...providersPerRou];
        const mergedProvidersPerReq = [...metadataPerMod3.providersPerReq, ...providersPerReq];

        // Creating a hierarchy of injectors.
        const injectorPerApp = this.perAppService.injector;
        const injectorPerMod = injectorPerApp.resolveAndCreateChild(providersPerMod);
        const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedProvidersPerRou);
        if (singleton) {
          let bodyParserConfig = injectorPerRou.get(BodyParserConfig, undefined, {}) as BodyParserConfig;
          bodyParserConfig = { ...new BodyParserConfig(), ...bodyParserConfig }; // Merge with default.
          if (bodyParserConfig.acceptMethods!.includes(httpMethod)) {
            providersPerRou.push({ token: HTTP_INTERCEPTORS, useClass: CtxBodyParserInterceptor, multi: true });
          }
        } else {
          const injectorPerReq = injectorPerRou.resolveAndCreateChild(mergedProvidersPerReq);
          let bodyParserConfig = injectorPerReq.get(BodyParserConfig, undefined, {}) as BodyParserConfig;
          bodyParserConfig = { ...new BodyParserConfig(), ...bodyParserConfig }; // Merge with default.
          if (bodyParserConfig.acceptMethods!.includes(httpMethod)) {
            providersPerReq.push({ token: HTTP_INTERCEPTORS, useClass: BodyParserInterceptor, multi: true });
          }
        }
      });
    });
  }
}
```

В даному разі, HTTP-інтерсептор додається в масив `providersPerReq`, у метадані контролера. Але перед цим, створюється [ієрархія інжекторів][8] для того, щоб отримати певну конфігурацію, яка вказує нам чи потрібно додавати такий інтерсептор. Якщо б не потрібно було перевіряти будь-яку умову, ми могли б не створювати ієрархії інжекторів, і зразу б додали інтерсептор на рівні запиту.

Звичайно ж, таке динамічне додавання провайдерів можливе лише перед створенням обробників HTTP-запитів.

[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/09-one-extension
[3]: https://github.com/ditsmod/ditsmod/blob/body-parser-2.17.0/packages/body-parser/src/body-parser.extension.ts#L54
[4]: #реєстрація-розширення-у-групі
[5]: /native-modules/body-parser
[6]: /native-modules/openapi
[7]: /components-of-ditsmod-app/dependency-injection#мульти-провайдери
[8]: /components-of-ditsmod-app/dependency-injection#hierarchy-and-encapsulation-of-injectors
[9]: /components-of-ditsmod-app/dependency-injection#провайдери
[10]: /components-of-ditsmod-app/http-interceptors/
