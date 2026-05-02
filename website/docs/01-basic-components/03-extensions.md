---
sidebar_position: 3
---

# Розширення

## Що робить розширення Ditsmod {#the-purpose-of-ditsmod-extension}

Як правило, розширення виконує свою роботу перед створенням обробників HTTP-запитів. Щоб змінити або розширити роботу застосунку, розширення використовує статичні метадані, що закріплені за певними декораторами. З іншого боку, розширення може ще й динамічно додавати метадані такого самого типу, як і ці статичні метадані. Розширення можуть ініціалізуватись асинхронно, і можуть залежати один від одного.

Задача більшості розширень полягає в тому, що вони, як на конвеєрі, на вході беруть один багатовимірний масив конфігураційних даних (метаданих), а на виході видають інший (або доповнений) багатовимірний масив, який в кінцевому підсумку інтерпретується цільовим розширенням, наприклад, для створенні роутів та їх обробників. Але не обов'язково щоб розширення працювали над конфігурацією та встановленням обробників HTTP-запитів; вони можуть ще й ініціалізувати конекшени баз даних, записувати логи чи збирати метрики для моніторингу, або виконувати будь-яку іншу роботу.

У більшості випадків, багатовимірні масиви конфігураційних даних відображають структуру застосунку:

1. вони розбиті по модулям;
2. у кожному модулі є контролери або провайдери;
3. кожен контролер має один або більше роутів.

Наприклад, в модулі [@ditsmod/body-parser][5] працює розширення, що динамічно додає HTTP-інтерсептор для парсингу тіла запиту до кожного роута, що має відповідний метод (POST, PATCH, PUT). Воно це робить один раз перед створенням обробників HTTP-запитів, тому за кожним запитом вже немає необхідності тестувати потребу такого парсингу.

Інший приклад. Модуль [@ditsmod/openapi][6] дозволяє створювати OpenAPI-документацію за допомогою власного декоратора `@oasRoute`. Без роботи розширення, Ditsmod буде ігнорувати метадані з цього нового декоратора. Розширення з цього модуля отримує згаданий вище конфігураційний масив, знаходить там метадані з декоратора `@oasRoute`, й інтерпретує ці метадані додаючи інші метадані, які будуть використовуватись цільовим розширенням для встановлення роутів.

## Що таке "розширення Ditsmod" {#what-is-ditsmod-extension}

У Ditsmod **розширенням** називається клас, що впроваджує інтерфейс `Extension`:

```ts
interface Extension<T> {
  /**
   * This method is called at the stage when providers are dynamically added.
   *
   * @param isLastModule Indicates whether this call is made in the last
   * module where this extension is imported or not.
   */
  stage1?(isLastModule: boolean): Promise<T>;
  /**
   * This method is called after the `stage1()` method has executed for all modules
   * in the application and this method takes a module-level injector as an argument.
   */
  stage2?(injectorPerMod: Injector): Promise<void>;
  /**
   * This method is called after the `stage2()` method has executed for all modules
   * in the application. There is no strict role for this method.
   */
  stage3?(): Promise<void>;
}
```

Кожне розширення потрібно реєструвати, про це буде згадано пізніше, а зараз припустимо, що така реєстрація відбулася, після чого йде наступний процес:

1. збираються метадані з усіх декораторів (`@rootModule`, `@featureModule`, `@controller`, `@route`...);
2. зібрані метадані передаються в DI з токеном `MetadataPerMod2`, отже - будь-яке розширення може отримати ці метадані у себе в конструкторі;
3. починається по-модульна робота розширень:
    - у кожному модулі збираються розширення, що створені в цому модулі, або імпортовані в цей модуль;
    - кожне з цих розширень отримує метадані, зібрані теж у цьому модулі, і викликаються методи `stage1`, `stage2`, `stage3` даних розширень.
4. створюються обробники HTTP-запитів;
5. застосунок починає працювати у звичному режимі, обробляючи HTTP-запити.

Готовий простий приклад ви можете проглянути у теці [00-standalone-application][1].

## Реєстрація розширення {#extension-registration}

Розширення передаються у метадані модуля, у властивість `extensions`. В залежності від вибраного вами архітектурного стилю, для цього можуть використовуватись такі декоратори як `featureModule`, `restModule`, `trpcModule` і т.д.:

```ts {5}
import { restModule } from '@ditsmod/rest';
import { SimpleExtension } from './simple-extension.js';

@restModule({
  extensions: [SimpleExtension]
})
export class AppModule {}
```

Це самий простий спосіб реєстрації розширення, який підходить лише для випадків, коли вам достатньо щоб розширення працювало у тому модулі, де воно оголошено і зареєстровано. Для більш складних конфігурацій, ви можете передати об'єкт, що має наступний тип:

```ts
class ExtensionConfig {
  extension: ExtensionClass;
  /**
   * The array of extension classes before which this extension will be called.
   */
  beforeExtensions?: ExtensionClass[];
  /**
   * The array of extension classes after which this extension will be called.
   */
  afterExtensions?: ExtensionClass[];
  /**
   * Each element in this array will form a separate group of extensions together with the current extension.
   * When one of the extensions from this array is passed to `ExtensionManager.stage1()`,
   * it will return the result of the `Extension.stage1()` method from each extension in the formed group.
   */
  groups?: ExtensionClass[];
  overrideExtension?: ExtensionClass;
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

Наприклад:

```ts {6-11}
import { restModule, RouteExtension } from '@ditsmod/rest';
import { SimpleExtension } from './simple-extension.js';

@restModule({
  extensions: [
    {
      extension: SimpleExtension,
      beforeExtensions: [RouteExtension],
      afterExtensions: [],
      export: true,
    },
  ],
})
export class SomeModule {}
```

Тобто у властивість `extension` передається клас розширення, яке ви декларуєте і реєструєте у поточному модулі. У властивість `beforeExtensions` або `afterExtensions` передаються відповідні класи розширень, якщо вам потрібно щоб зареєстроване розширення працювало перед або після вказаних розширень. Опціонально можна використовувати властивість `export` або `exportOnly` для того, щоб вказати, чи потрібно щоб дане розширення працювало у зовнішньому модулі, яке імпортуватиме цей модуль. Окрім цього, властивість `exportOnly` ще й вказує на те, що дане розширення не потрібно запускати у так званому хост-модулі (тобто в модулі, де оголошується це розширення).

## Групи розширень {#group-of-extensions}

Будь-яке розширення може входити в одну або декілька груп. Концепція **групи розширень** аналогічна до концепції групи [інтерсепторів][10]. Давайте згадаємо, що група інтерсепторів виконує конкретний вид робіт: доповнює обробку HTTP-запиту для певного роута в контролері. Аналогічно, кожна група розширень - це окремий вид робіт над певними метаданими. Як правило, розширення в певній групі повертають метадані, що мають однаковий базовий інтерфейс. По-суті, групи розширень дозволяють абстрагуватись від конкретних розширень, роблячи важливими лише вид роботи, що виконується у даних групах.

Наприклад, у `@ditsmod/rest` є `RouteExtension`, що обробляє метадані, зібрані з декоратора `@route()`. Якщо в якомусь застосунку потрібна документація OpenAPI - можна додатково підключити модуль `@ditsmod/openapi`, де зареєстровано `OpenapiRouteExtension`, що працює з декоратором `@oasRoute()`. В метаданих модуля `@ditsmod/openapi` вказано, що `OpenapiRouteExtension` потрібно використовувати в одній групі з `RouteExtension`:

```ts
extensions: [
  { extension: OpenapiRouteExtension, groups: [RouteExtension], export: true },
  // ...
],
```

Як бачите, групи формуються завдяки властивості `groups` у метаданих модуля. Ці два розширення зібрані в одну групу через те, що обидва вони налаштовують роути, а їхні методи `stage1()` повертають дані з однаковим базовим інтерфейсом. Тепер, якщо обидва ці розширення імпортуються в один і той самий модуль, усі споживачі, що запитують дані від `RouteExtension`, отримуватимуть також результати роботи від `OpenapiRouteExtension`, яке повертає дані з розширеним інтерфейсом.

Спільний базовий інтерфейс даних, який повертає кожне з розширень у певній групі, - це важлива умова, оскільки інші розширення можуть очікувати дані із цієї групи, і вони будуть опиратись саме на цей базовий інтерфейс. Звичайно ж, базовий інтерфейс при потребі можна розширювати, але не звужувати.

Окрім цього, важливою є також послідовність запуску окремих груп розширень і залежність між ними. У нашому прикладі, після того, як відпрацює група з `RouteExtension` та `OpenapiExtension`, їхні дані збираються в один масив і передаються до `PreRouterExtension`. Навіть якщо ви пізніше зареєструєте більше нових розширень у групі з `RouteExtension`, все-одно `PreRouterExtension` буде запускатись вже після того як відпрацюють абсолютно усі розширення у групі з `RouteExtension`, включаючи ваші нові розширення.

Ця фіча є дуже зручною, оскільки вона інколи дозволяє інтегрувати зовнішні модулі Ditsmod (наприклад, з npmjs.com) у ваш застосунок без жодних налаштувань, просто імпортуючи їх у потрібний модуль. Імпортовані розширення, що входять до певних груп, будуть запускатись у правильній послідовності, навіть якщо вони імпортовані з різних зовнішніх модулів.

Зверніть увагу, що у властивості `groups` вказуються "заголовні" елементи **окремих** груп (а не однієї групи):

```ts
extensions: [
  { extension: Extension3, groups: [Extension1, Extension2], export: true },
  // ...
],
```

На основі такої конфігурації, буде створено дві окремі групи розширень:

1. `Extension1`, `Extension3`;
2. `Extension2`, `Extension3`.

Якщо в поточному модулі інші розширення також вкажуть ці самі "заголовні" елементи в `groups`, дані групи розширяться:

```ts
extensions: [
  { extension: Extension4, groups: [Extension1, Extension2], export: true },
  // ...
],
```

Причому не важливо, чи `Extension4` оголошено в поточному модулі, чи воно імпортувалось з іншого модуля. Тепер у цих групах будуть такі елементи:

1. `Extension1`, `Extension3`, `Extension4`;
2. `Extension2`, `Extension3`, `Extension4`.

## Використання ExtensionManager {#using-extensionmanager}

Якщо певне розширення має залежність від іншого розширення, рекомендується вказувати таку залежність за допомогою `ExtensionManager`. Він ініціалізує розширення дотримуючись відповідної послідовності, що вказана у конфігах цих розширень, кешує результати роботи методів `extension.stage1()`, кешує результати роботи груп розширень, кидає помилки про циклічні залежності між розширеннями, і показує весь ланцюжок розширень, що призвів до зациклення. Окрім цього, `ExtensionManager` дозволяє збирати результати ініціалізації розширень з усього застосунку, а не лише з одного модуля.

Припустимо `Extension2` очікує результати роботи методу `stage1()` від `Extension1`, тому в конструкторі вказується залежність від `ExtensionManager`, а у `extension2.stage1()` викликається `this.extensionManager.stage1()`:

```ts {11}
import { injectable } from '@ditsmod/core';
import { Extension, ExtensionManager } from '@ditsmod/core';

import { Extension1 } from './extension1.js';

@injectable()
export class Extension2 implements Extension<void> {
  constructor(private extensionManager: ExtensionManager) {}

  async stage1() {
    const stage1ExtensionMeta = await this.extensionManager.stage1(Extension1);

    stage1ExtensionMeta.groupData.forEach((stage1Meta) => {
      const someData = stage1Meta;
      // Do something here.
      // ...
    });
  }
}
```

Зверніть увагу, що `stage1ExtensionMeta.groupData` завжди буде мати масив результатів, не залежно від того, чи в поточному модулі `Extension1` входить у групу розширень, чи ні. Тут `stage1ExtensionMeta` має наступний інтерфейс:

```ts
interface Stage1ExtensionMeta<T = any> {
  delay: boolean;
  countdown: number;
  groupDataPerApp: Stage1ExtensionMetaPerApp<T>[];
  moduleName: string,
  groupDebugMeta: Stage1DebugMeta<T>[],
  groupData: T[],
}

interface Stage1DebugMeta<T = any> {
  extension: Extension<T>,
  payload: T,
  delay: boolean,
  countdown: number,
}
```

Якщо `stage1ExtensionMeta.delay === true` - це означає, що властивість `groupDataPerApp` містить дані ще не з усіх модулів, куди імпортовано дане розширення (`Extension1`). Властивість `countdown` вказує, у скількох модулях ще залишилось відпрацювати даному розширенню, щоб властивість `groupDataPerApp` містила дані з усіх модулів. Тобто властивості `delay` та `countdown` стосуються лише властивості `groupDataPerApp`.

У властивості `groupData` знаходиться масив, де зібрані дані з поточного модуля від одного чи декількох розширень.

Важливо пам'ятати, що для кожного модуля створюється окремий інстанс певного розширення. Наприклад, якщо `Extension2` імпортовано у три різні модулі, то Ditsmod буде послідовно обробляти ці три модулі із трьома різними інстансами `Extension2`. Окрім цього, якщо `Extension2` потребує підсумкові дані, наприклад, від `Extension1` із чотирьох модулів, а саме `Extension2` імпортовано лише у три модулі, це означає, що з одного модуля `Extension2` може і не отримати необхідних даних.

В такому випадку потрібно передавати `this` у якості другого аргументу до `extensionManager.stage1`:

```ts {11}
import { injectable } from '@ditsmod/core';
import { Extension, ExtensionManager } from '@ditsmod/core';

import { Extension1 } from './extension1.js';

@injectable()
export class Extension2 implements Extension<void> {
  constructor(private extensionManager: ExtensionManager) {}

  async stage1() {
    const stage1ExtensionMeta = await this.extensionManager.stage1(Extension1, this);
    if (stage1ExtensionMeta.delay) {
      return;
    }

    stage1ExtensionMeta.groupDataPerApp.forEach((totaStage1Meta) => {
      totaStage1Meta.groupData.forEach((metadataPerMod3) => {
        // Do something here.
        // ...
      });
    });
  }
}
```

Тобто коли вам потрібно щоб `Extension2` отримало дані від `Extension1` з усього застосунку, другим аргументом для методу `extensionManager.stage1` потрібно передавати `this`:

```ts
const stage1ExtensionMeta = await this.extensionManager.stage1(Extension1, this);
```

В такому разі гарантується, що інстанс `Extension2` отримає дані з усіх модулів, куди імпортовано `Extension1`. Навіть якщо `Extension1` та `Extension2` будуть імпортовані у окремі модулі (тобто вони не зустрічаються у спільному модулі), все-одно у підсумку `extension2.stage1` отримає дані від `extension1.stage1` з усіх модулів.

## Динамічне додавання провайдерів {#dynamic-addition-of-providers}

Будь-яке розширення може вказати залежність від групи розширень, де є заголовним `RouteExtension`, щоб динамічно додавати провайдери на будь-якому рівні. Розширення з цієї групи використовують метадані з інтерфейсом `MetadataPerMod2` і повертають метадані з інтерфейсом `MetadataPerMod3`.

Можна проглянути як це зроблено у [BodyParserExtension][3]:

```ts {9,25,32}
@injectable()
export class BodyParserExtension implements Extension<void> {
  constructor(
    protected extensionManager: ExtensionManager,
    protected perAppService: PerAppService,
  ) {}

  async stage1() {
    const stage1ExtensionMeta = await this.extensionManager.stage1(RouteExtension);
    stage1ExtensionMeta.groupData.forEach((metadataPerMod3) => {
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

[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/00-standalone-application
[3]: https://github.com/ditsmod/ditsmod/blob/body-parser-2.17.0/packages/body-parser/src/body-parser.extension.ts#L54
[4]: #extension-registration
[5]: /rest-application/native-modules/body-parser
[6]: /rest-application/native-modules/openapi
[8]: /basic-components/dependency-injection#hierarchy-and-encapsulation-of-injectors
[10]: /rest-application/http-interceptors/
