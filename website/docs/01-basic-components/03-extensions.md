---
sidebar_position: 3
---

# Розширення

## Що робить розширення Ditsmod {#the-purpose-of-ditsmod-extension}

Розширення починають працювати, коли Ditsmod зібрав статичні метадані з декораторів на рівні класу, та експортував/імпортував модулі і провайдери саме так, як це було прописано в зібраних статичних метаданих модуля. Як правило, розширення виконує свою роботу перед створенням обробників HTTP-запитів. Щоб змінити або розширити роботу застосунку, розширення використовує статичні метадані, що закріплені за певними декораторами. З іншого боку, розширення може ще й динамічно додавати метадані такого самого типу, як і ці статичні метадані. Розширення можуть ініціалізуватись асинхронно, і можуть залежати один від одного.

Образно кажучи, модуль + розширення за концепцією своєї роботи злегка нагадують "хмарного провайдера", що забезпечує лише інфраструктуру для бізнесу. Тобто сама бізнес-логіка пишеться не у розширеннях, а вже у сервісах, контролерах, ґардах, інтерсепторах і т.д., які будуть працювати після підготовчої роботи розширень.

Концепція роботи розширень у дуже спрощеному вигляді є наступною:

```ts {16-27}
import { createServer } from 'http';
import { Injector } from '@ditsmod/core';

class Service1 {
  // ...
}
class Controller1 {
  // ...
}
class Interceptor1 {
  // ...
}

let handler: (req, res) => Promise<void>;

async function extension1() {
  const injector = Injector.resolveAndCreate([
    Service1,
    { token: 'controller1', useClass: Controller1 },
    { token: 'interceptors', useClass: Interceptor1, multi: true },
  ]);

  handler = async function (req, res) {
    const interceptors = injector.get('interceptors') as Interceptor1[];
    // ...
  };
}

await extension1();

const server = createServer(async (req, res) => {
  await handler(req, res);
});

server.listen(3000, () => {
  console.log('Webserver run on http://localhost:3000');
});
```

Як бачите, спочатку оголошено сервіс, контролер та інтерсептор, які символізують тут розрізнені елементи застосунку. Потім, у виділених рядках, показано функцію `extension1()`, яка тут умовно символізує функціональність розширення. Тобто, по-суті, розширення збирає до купи певні елементи застосунку, створює інжектор, і в кінцевому підсунку створює обробника HTTP-запитів.

Задача більшості розширень полягає в тому, що вони, як на конвеєрі, на вході беруть один багатовимірний масив конфігураційних даних (метаданих), а на виході видають інший (або доповнений) багатовимірний масив, який в кінцевому підсумку інтерпретується цільовим розширенням, наприклад, для створенні роутів та їх обробників. Але не обов'язково щоб розширення працювали над конфігурацією та встановленням обробників HTTP-запитів; вони можуть ще й ініціалізувати конекшени баз даних, збирати метрики для моніторингу, надавати змінні для сесії [REPL][100], або виконувати будь-яку іншу роботу.

У більшості випадків, багатовимірні масиви конфігураційних даних відображають структуру застосунку:

1. вони розбиті по модулям;
2. у кожному модулі є контролери або провайдери;
3. кожен контролер має один або більше роутів.

Простий і практичний приклад роботи розширень можна знайти в модулі [@ditsmod/body-parser][101], де працює розширення, що динамічно додає HTTP-інтерсептор для парсингу тіла запиту до кожного роута, що має відповідний метод (POST, PATCH, PUT). Воно це робить один раз перед створенням обробників HTTP-запитів, тому за кожним запитом вже немає необхідності тестувати потребу такого парсингу.

Інший приклад. Модуль [@ditsmod/rest][6] дозволяє встановлювати роути за допомогою власного декоратора `@route`. Без роботи розширення, Ditsmod буде ігнорувати метадані з цього декоратора. Розширення з цього модуля отримує згаданий вище конфігураційний масив, знаходить там метадані з декоратора `@route`, й інтерпретує їх додаючи інші метадані, які будуть використовуватись цільовим розширенням для встановлення роутів.

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

Кожен із указаних методів виступає в ролі хука, які Ditsmod викликає автоматично. В документації інколи ви можете зустрічати фрази, типу "значення, що повертає розширення"; в таких випадках мається на увазі значення, що повертає метод `stage1()` даного розширення. Готовий простий приклад ви можете проглянути у теці [00-standalone-application][103].

Імплементацію даного інтерфейсу можна зробити, наприклад, так:

```ts
import { injectable, Extension, Logger } from '@ditsmod/core';

@injectable()
export class SimpleExtension implements Extension<void> {
  constructor(private logger: Logger) {}

  async stage1() {
    // ...
    this.logger.log('info', 'some message');
  }
}
```

Як бачите, розширення можуть вказувати залежність від сервісів, провайдери яких можуть бути оголошені на рівні модуля чи застосунку. Але майте на увазі, що інжектор, який доступний через конструктор розширення, формується ще до того, як розширення починають працювати, тому до нього не передаються провайдери від інших розширень.

Під час виконання `stage1()` будь-яке розширення може [динамічно додавати провайдери][7] на будь-який [рівень ієрархії][8]. Лише після завершення `stage1()` в усіх розширеннях всіх модулів, створюються фінальні інжектори - один на рівні застосунку та окремі на рівні кожного модуля. Інжектор модуля передається аргументом у `stage2(injectorPerMod)`. На цьому етапі також можна додавати провайдери, але лише на рівнях, нижчих за модуль. Це мають робити ті розширення, для яких ці провайдери призначені, і вони ж самостійно створюють відповідні фінальні інжектори.

Якщо якщо в конструкторі розширення запитати `Injector`, ви отримаєте спеціальний інжектор на рівні модуля, що призначено лише для розширень. Тому немає сенсу передавати у нього значення сподіваючись, що вони будуть доступними у фінальних інжекторах. Лише на другому та третьопу етапі ініціалізації розширень ви :

```ts {8,15,17}
import { injectable, Extension, Injector } from '@ditsmod/core';

@injectable()
export class SimpleExtension implements Extension<void> {
  constructor(private injector: Injector) {}

  async stage1() {
    this.injector.setCtx('some-token', 'some value'); // ❌ Не робіть так
  }

  async stage2(injectorPerMod: Injector) {
    injectorPerMod === this.injector; // false
    injectorPerMod.get('some-token'); // may return undefined

    injectorPerMod.setCtx('some-token', 'some value'); // ✅ Рівень модуля
    // OR
    injectorPerMod.parent.setCtx('some-token', 'some value'); // ✅ Рівень застосунку
  }
}
```

Якщо ви хочете передати готове значення на першому етапі ініціалізації розширення, правильнішим буде [передавати][7] їх як [ValueProvider][11] у метаданих.

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
import { restModule, RestRouteExtension } from '@ditsmod/rest';
import { SimpleExtension } from './simple-extension.js';

@restModule({
  extensions: [
    {
      extension: SimpleExtension,
      beforeExtensions: [RestRouteExtension],
      afterExtensions: [],
      export: true,
    },
  ],
})
export class SomeModule {}
```

Тобто у властивість `extension` передається клас розширення, яке ви декларуєте і реєструєте у поточному модулі. У властивість `beforeExtensions` або `afterExtensions` передаються відповідні класи розширень, якщо вам потрібно щоб зареєстроване розширення працювало перед або після вказаних розширень. Опціонально можна використовувати властивість `export` або `exportOnly` для того, щоб вказати, чи потрібно щоб дане розширення працювало у зовнішньому модулі, яке імпортуватиме цей модуль. Окрім цього, властивість `exportOnly` ще й вказує на те, що дане розширення не потрібно запускати у так званому хост-модулі (тобто в модулі, де оголошується це розширення).

Також ви можете підмінити зовнішнє розширення, яке імпортується в поточний модуль:

```ts
extensions: [
  { extension: MyExtension, overrideExtension: ExternalExtension }
],
```

В даному разі `ExternalExtension` імпортується в поточний модуль, де ви його підміняєте `MyExtension`.

## Групи розширень {#group-of-extensions}

Будь-яке розширення може входити в одну або декілька груп. Концепція **групи розширень** аналогічна до концепції групи [інтерсепторів][10]. Давайте згадаємо, що група інтерсепторів виконує конкретний вид робіт: доповнює обробку HTTP-запиту для певного роута в контролері. Аналогічно, кожна група розширень - це окремий вид робіт над певними метаданими. Як правило, розширення в певній групі повертають метадані, що мають однаковий базовий інтерфейс. По-суті, групи розширень дозволяють абстрагуватись від конкретних розширень, роблячи важливими лише вид роботи, що виконується у даних групах.

Наприклад, у `@ditsmod/rest` є `RestRouteExtension`, що обробляє метадані, зібрані з декоратора `@route()`. Якщо в якомусь застосунку потрібна документація OpenAPI - можна додатково підключити модуль `@ditsmod/openapi`, де зареєстровано `OpenapiRouteExtension`, що працює з декоратором `@oasRoute()`. В метаданих модуля `@ditsmod/openapi` вказано, що `OpenapiRouteExtension` потрібно використовувати в одній групі з `RestRouteExtension`:

```ts
extensions: [
  { extension: OpenapiRouteExtension, groups: [RestRouteExtension], export: true },
  // ...
],
```

Як бачите, групи формуються завдяки властивості `groups` у метаданих модуля. Ці два розширення зібрані в одну групу через те, що обидва вони налаштовують роути, а їхні методи `stage1()` повертають дані з однаковим базовим інтерфейсом. Тепер, якщо обидва ці розширення імпортуються в один і той самий модуль, усі споживачі, що запитують дані від `RestRouteExtension`, отримуватимуть також результати роботи від `OpenapiRouteExtension`, яке повертає дані з розширеним інтерфейсом.

Спільний базовий інтерфейс даних, який повертає кожне з розширень у певній групі, - це важлива умова, оскільки інші розширення можуть очікувати дані із цієї групи, і вони будуть опиратись саме на цей базовий інтерфейс. Звичайно ж, базовий інтерфейс при потребі можна розширювати, але не звужувати.

Окрім цього, важливою є також послідовність запуску окремих груп розширень і залежність між ними. У нашому прикладі, після того, як відпрацює група з `RestRouteExtension` та `OpenapiRouteExtension`, їхні дані збираються в один масив і передаються до `PreRouterExtension`. Навіть якщо ви пізніше зареєструєте більше нових розширень у цій групі, все-одно `PreRouterExtension` буде запускатись вже після того як відпрацюють абсолютно усі розширення у цій групі, включаючи ваші нові розширення. Така поведінка продиктована інструкціями, що записані під час оголошення `RestRouteExtension`:

```ts
extensions: [
  { extension: RestRouteExtension, beforeExtensions: [PreRouterExtension], exportOnly: true },
  // ...
],
```

Як бачите, тут нічого не сказано про `OpenapiRouteExtension`, і навіть коли оголошували `OpenapiRouteExtension` - там теж не було сказано, що `OpenapiRouteExtension` повинно працювати перед `PreRouterExtension`. Достатньо щоб під час оголошення `OpenapiRouteExtension` було вказано `groups: [RestRouteExtension]`, і це вже автоматично ставить у чергу `OpenapiRouteExtension` після `RestRouteExtension`, але перед `PreRouterExtension`.

Ця фіча є дуже зручною, оскільки вона інколи дозволяє інтегрувати зовнішні модулі Ditsmod (наприклад, з npmjs.com) у ваш застосунок без жодних налаштувань, просто імпортуючи їх у потрібний модуль. Імпортовані розширення, що входять до певних груп, будуть запускатись у правильній послідовності, навіть якщо вони імпортовані з різних зовнішніх модулів.

Зверніть увагу, що у властивості `groups` вказуються класи розширень, які виступають у ролі токенів окремих груп:

```ts
extensions: [
  { extension: Extension3, groups: [Extension1, Extension2], export: true },
  // ...
],
```

На основі такої конфігурації, буде створено дві окремі групи розширень:

- Перша група: `Extension1`, `Extension3`.
- Друга група: `Extension2`, `Extension3`.

Якщо в поточному модулі інші розширення також вкажуть ці самі токени груп в `groups`, дані групи розширяться:

```ts
extensions: [
  { extension: Extension4, groups: [Extension1, Extension2], export: true },
  // ...
],
```

Тепер у цих групах будуть такі елементи:

- Перша група: `Extension1`, `Extension3`, `Extension4`.
- Друга група: `Extension2`, `Extension3`, `Extension4`.

Причому не важливо, чи `Extension4` оголошено в поточному модулі, чи воно імпортувалось з іншого модуля.

## Використання ExtensionManager {#using-extensionmanager}

Якщо певне розширення має залежність від іншого розширення, рекомендується вказувати таку залежність за допомогою `ExtensionManager`. Він ініціалізує розширення дотримуючись відповідної послідовності, що вказана у конфігах цих розширень, кешує результати роботи методів `extension.stage1()`, кешує результати роботи груп розширень, кидає помилки про циклічні залежності між розширеннями, і показує весь ланцюжок розширень, що призвів до зациклення. Окрім цього, `ExtensionManager` дозволяє збирати результати ініціалізації розширень з усього застосунку, а не лише з одного модуля.

Припустимо `Extension2` очікує результати роботи методу `stage1()` від `Extension1`, тому в конструкторі вказується залежність від `ExtensionManager`, а у `extension2.stage1()` викликається `this.extensionManager.stage1()`:

```ts {9}
import { injectable, Extension, ExtensionManager } from '@ditsmod/core';
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

У властивості `groupData` знаходиться масив, де зібрані дані з поточного модуля від одного чи декількох розширень. А у властивості `groupDebugMeta` знаходиться більш детальна інформація про розширення, які зформували дані у `groupData`. Елементи у масиві `groupData` відповідають елементам у масиві `groupDebugMeta` за індексом, тобто:

```ts
groupData[0] === groupDebugMeta[0]?.payload; // true
```

Важливо пам'ятати, що для кожного модуля створюється окремий інстанс певного розширення. Наприклад, якщо `Extension2` імпортовано у три різні модулі, то Ditsmod буде послідовно обробляти ці три модулі із трьома різними інстансами `Extension2`. Окрім цього, якщо `Extension2` потребує підсумкові дані, наприклад, від `Extension1` із чотирьох модулів, а саме `Extension2` імпортовано лише у три модулі, це означає, що з одного модуля `Extension2` може і не отримати необхідних даних.

В такому випадку потрібно передавати `this` у якості другого аргументу до `extensionManager.stage1`:

```ts {9}
import { injectable, Extension, ExtensionManager } from '@ditsmod/core';
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

### Токени груп розширень {#extension-group-tokens}

Давайте повернемось до [попереднього прикладу з кодом][2], де оголошуються дві окремі групи розширень, коли у властивість `groups` ми передаємо класи двох розширень:

```ts
extensions: [
  { extension: Extension3, groups: [Extension1, Extension2], export: true },
  // ...
],
```

І, як вже було сказано, на основі цієї конфігурації створюються дві окремі групи:

- Перша група: `Extension1`, `Extension3`.
- Друга група: `Extension2`, `Extension3`.

Тепер, коли ви ознайомились з `ExtensionManager`, важливо наголосити на тому, що пошук груп розширень відбуваються за токенами - за тим класами розширень, які ми раніше вказали у властивості `groups`:

```ts
await this.extensionManager.stage1(Extension1); // Повертаються дані від Extension1 та Extension3
await this.extensionManager.stage1(Extension2); // Повертаються дані від Extension2 та Extension3
await this.extensionManager.stage1(Extension3); // Повертаються дані лише від Extension3
```

Тобто тут `Extension1` та `Extension2` фактично виступають у ролі токенів (чи ідентифікаторів) груп.

## Динамічне додавання провайдерів {#dynamic-addition-of-providers}

Якщо ви використовуєте `@ditsmod/rest`, будь-яке розширення може вказати залежність від `RestRouteExtension`, щоб динамічно додавати провайдери на будь-якому рівні. Це розширення використовує метадані з інтерфейсом `MetadataPerMod2` і повертає метадані з інтерфейсом `MetadataPerMod3`.

Можна проглянути як це зроблено у [BodyParserExtension][102]:

```ts {13,31,38}
import { Extension, ExtensionManager, PerAppService, injectable } from '@ditsmod/core';
import { HTTP_INTERCEPTORS, RestRouteExtension } from '@ditsmod/rest';
// ...

@injectable()
export class BodyParserExtension implements Extension<void> {
  constructor(
    protected extensionManager: ExtensionManager,
    protected perAppService: PerAppService,
  ) {}

  async stage1() {
    const stage1ExtensionMeta = await this.extensionManager.stage1(RestRouteExtension);
    stage1ExtensionMeta.groupData.forEach((metadataPerMod3) => {
      const { aControllerMetadata } = metadataPerMod3;
      const { providersPerMod } = metadataPerMod3.baseMeta;
      aControllerMetadata.forEach(({ providersPerRou, providersPerReq, httpMethods, scope }) => {
        // Merging the providers from a module and a controller
        const mergedProvidersPerRou = [...metadataPerMod3.meta.providersPerRou, ...providersPerRou];
        const mergedProvidersPerReq = [...metadataPerMod3.meta.providersPerReq, ...providersPerReq];

        // Creating a hierarchy of injectors.
        const injectorPerApp = this.perAppService.injector;
        const injectorPerMod = injectorPerApp.resolveAndCreateChild(providersPerMod);
        const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedProvidersPerRou);
        httpMethods.forEach((method) => {
          if (scope == 'ctx') {
            let bodyParserConfig = injectorPerRou.get(BodyParserConfig, {}) as BodyParserConfig;
            bodyParserConfig = { ...new BodyParserConfig(), ...bodyParserConfig }; // Merge with default.
            if (bodyParserConfig.acceptMethods!.includes(method)) {
              providersPerRou.push({ token: HTTP_INTERCEPTORS, useClass: CtxBodyParserInterceptor, multi: true });
            }
          } else {
            const injectorPerReq = injectorPerRou.resolveAndCreateChild(mergedProvidersPerReq);
            let bodyParserConfig = injectorPerReq.get(BodyParserConfig, {}) as BodyParserConfig;
            bodyParserConfig = { ...new BodyParserConfig(), ...bodyParserConfig }; // Merge with default.
            if (bodyParserConfig.acceptMethods!.includes(method)) {
              providersPerReq.push({ token: HTTP_INTERCEPTORS, useClass: BodyParserInterceptor, multi: true });
            }
          }
        });
      });
    });
  }
}
```

В даному разі, у метадані контролера додається HTTP-інтерсептор в масив `providersPerReq` або `providersPerRou` (в залежності від режиму роботи контролера). Зверніть увагу, що тут створюється [ієрархія інжекторів][8], яка використовуються лише щоб отримати значення для токена `BodyParserConfig`, що вказує нам чи потрібно додавати інтерсептор. Піля цього дані інжектори нікуди більше не передаються, тобто видаляються з пам'яті.

А інжектори, що містять провайдери, зібрані від усіх розширень, будуть створені згодом - у `PreRouterExtension`. Саме тому у метаданих `BodyParserModule` прописано, що `BodyParserExtension` повинно працювати після `RestRouteExtension`, але перед `PreRouterExtension`:

```ts {7-8}
import { RestRouteExtension, PreRouterExtension } from '@ditsmod/rest';

// ... Тут оголошується BodyParserModule
extensions: [
  {
    extension: BodyParserExtension,
    afterExtensions: [RestRouteExtension],
    beforeExtensions: [PreRouterExtension],
    exportOnly: true,
  },
],
// ...
```

[2]: #group-of-extensions
[4]: /basic-components/dependency-injection/#injector-and-providers
[6]: /rest-application/native-modules/openapi
[7]: #dynamic-addition-of-providers
[8]: /basic-components/dependency-injection#hierarchy-of-injectors-in-the-ditsmod-application
[9]: #using-extensionmanager
[10]: /rest-application/http-interceptors/
[11]: /basic-components/dependency-injection/#provider

[100]: https://nodejs.org/api/repl.html
[101]: https://github.com/ditsmod/ditsmod/tree/main/examples/06-body-parser
[102]: https://github.com/ditsmod/ditsmod/blob/3.0.0-next.8/packages/body-parser/src/body-parser.extension.ts#L41
[103]: https://github.com/ditsmod/ditsmod/tree/main/examples/00-standalone-application
