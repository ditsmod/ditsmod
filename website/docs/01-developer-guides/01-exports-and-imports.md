---
sidebar_position: 1
---

# Експорт, імпорт, прикріплення

Модуль, де ви декларуєте певні [провайдери][1], називається **модулем-хостом** для цих провайдерів. А коли ви використовуєте дані провайдери у зовнішньому модулі, то цей зовнішній модуль називається **модулем-споживачем** даних провайдерів.

Для того, щоб модуль-споживач міг використовувати провайдери з модуля-хоста, спочатку необхідно експортувати відповідні [токени][1] провайдерів з модуля-хоста. Робиться це у метаданих, які передаються у декоратор в модуль фіч чи кореневий модуль. Наприклад, якщо ви використовуєте REST, це робиться наступним чином:

```ts {9}
import { restModule } from '@ditsmod/rest';

import { FirstService } from './first.service.js';
import { SecondService } from './second.service.js';
import { ThirdService } from './third.service.js';

@restModule({
  providersPerMod: [FirstService, { token: SecondService, useClass: ThirdService }],
  exports: [SecondService],
})
export class SomeModule {}
```

Беручи до уваги експортовані токени, Ditsmod буде шукати експортовані провайдери в масиві `providersPerMod`. Експортувати провайдери, що передаються у `providersPerApp`, не має сенсу, оскільки з цього масиву буде сформовано [інжектор][1] на рівні застосунку. Тобто провайдери з масиву `providersPerApp` будуть доступними для будь-якого модуля, на будь-якому рівні, і без експорту.

Оскільки з модуля-хоста вам потрібно експортувати лише токени провайдерів, а не самі провайдери, у властивість `exports` не можна безпосередньо передавати провайдери у формі об'єкта.

Майте на увазі, що з модуля-хоста потрібно експортувати лише ті провайдери, які безпосередньо будуть використовуватись у модулях-споживачах. У прикладі вище, `SecondService` може залежати від `FirstService`, але `FirstService` не потрібно експортувати, якщо він безпосередньо не використовується у модулі-споживачу. Таким чином забезпечується інкапсуляція модулів.

Експортувати контролери не має сенсу, оскільки експорт стосується тільки провайдерів.

## Експорт провайдерів з модуля фіч {#exporting-providers-from-a-featuremodule}

Експортуючи токени з модуля-хоста, ви тим самим декларуєте, що відповідні провайдери можуть використовуватись у модулях-споживачах, якщо вони імпортуватимуть даний модуль-хост.

## Експорт провайдерів з кореневого модуля {#exporting-providers-from-rootmodule}

Експорт провайдерів з кореневого модуля означає, що ці провайдери будуть автоматично додаватись до кожного модуля, що є в застосунку. Наприклад, якщо ви використовуєте REST, це робиться наступним чином:

```ts {9}
import { restRootModule } from '@ditsmod/rest';

import { SomeService } from './some.service.js';
import { OtherModule } from './other.module.js';

@restRootModule({
  imports: [OtherModule],
  providersPerMod: [SomeService],
  exports: [SomeService, OtherModule],
})
export class AppModule {}
```

В даному випадку, `SomeService` буде додаватись до усіх модулів застосунку на рівні модуля. Як бачите, експортувати можна також і цілі модулі. В даному разі, усі провайдери, що експортуються з `OtherModule`, також будуть додаватись до кожного модуля застосунку.

## Імпорт модуля {#import-module}

Імпортувати окремий провайдер в модуль не можна, але можна імпортувати цілий модуль з усіма провайдерами та [розширеннями][2], що експортуються з нього. Наприклад, якщо ви використовуєте REST, це робиться наступним чином:

```ts {6}
import { restModule } from '@ditsmod/rest';
import { FirstModule } from './first.module.js';

@restModule({
  imports: [
    FirstModule
  ]
})
export class SecondModule {}
```

Якщо з `FirstModule` експортується, наприклад, `SomeService`, то тепер цей сервіс можна використовувати у `SecondModule`. Разом з тим, якщо `FirstModule` має контролери, у такій формі імпорту вони будуть ігноруватись. Щоб Ditsmod брав до уваги контролери з імпортованого модуля, цей модуль потрібно імпортувати з префіксом, що передається у `path`:

```ts {6}
import { restModule } from '@ditsmod/rest';
import { FirstModule } from './first.module';

@restModule({
  imports: [
    { module: FirstModule, path: '' }
  ]
})
export class SecondModule {}
```

Хоча тут `path` має порожній рядок, але для Ditsmod наявність `path` означає:

1. що потрібно брати до уваги також і контролери з імпортованого модуля;
2. використовувати `path` у якості префіксу для усіх контролерів, що імпортуються з `FirstModule`.

Як бачите, у попередньому прикладі імпортується на цей раз і не провайдер, і не модуль, а об'єкт. Цей об'єкт має наступний інтерфейс:

### ModuleWithParams {#ModuleWithParams}

```ts
interface ModuleWithParams {
  id?: string;
  module: ModuleType<M>;
  /**
   * Providers per the application.
   */
  providersPerApp?: Providers | Provider[] = [];
  /**
   * Providers per a module.
   */
  providersPerMod?: Providers | Provider[] = [];
  /**
   * List of modules, `ModuleWithParams` or tokens of providers exported by this
   * module.
   */
  exports?: any[];
  /**
   * This property allows you to pass any information to extensions.
   *
   * You must follow this rule: data for one extension - one key in `extensionsMeta` object.
   */
  extensionsMeta?: E;
}
```

Щоб скоротити довжину запису при імпорті об'єкту з цим типом, інколи доцільно написати статичний метод у модулі, який імпортується. Щоб наочно побачити це, давайте візьмемо знову попередній приклад:

```ts {6}
import { restModule } from '@ditsmod/rest';
import { FirstModule } from './first.module';

@restModule({
  imports: [
    { module: FirstModule, path: '' }
  ]
})
export class SecondModule {}
```

Якщо б ви оголошували `FirstModule` і знали, що цей модуль є сенс імпортувати багато разів в різні модулі з різними префіксами, в такому разі в даному класі можна написати статичний метод, що повертає об'єкт, спеціально призначений для імпорту:

```ts
// ...
export class FirstModule {
  static withPrefix(path: string) {
    return {
      module: this,
      path,
    };
  }
}
```

Тепер об'єкт, що повертає цей метод, можна імпортувати наступним чином:

```ts {4}
// ...
@restModule({
  imports: [
    FirstModule.withPrefix('some-prefix')
  ]
})
export class SecondModule {}
```

Статичні методи дозволяють спрощувати передачу параметрів модулів.

Щоб TypeScript контролював, що саме повертає статичний метод для імпорту, рекомендується використовувати інтерфейс `ModuleWithParams`:

```ts
import { ModuleWithParams } from '@ditsmod/core';
// ...
export class SomeModule {
  static withParams(someParams: SomeParams): ModuleWithParams<SomeModule> {
    return {
      module: this,
      // ...
    }
  }
}
```

### Імпортуються класи чи інстанси класів? {#import-classes-or-class-instances}

Давайде розглянемо конкретну ситуацію. В наступному прикладі кожен із провайдерів є класом. Зверніть увагу, в які масиви передаються ці провайдери, і що саме експортується.

```ts
// ...
@restModule({
  providersPerMod: [Provider1],
  exports: [Provider1],
})
export class Module1 {}
```

Припустимо ми цей модуль будемо імпортувати у `Module2`, в якого своїх провайдерів немає:

```ts
// ...
@restModule({
  imports: [Module1]
  // ...
})
export class Module2 {}
```

В результаті такого імпорту, модуль-споживач (`Module2`) тепер матиме `Provider1` на рівні модуля, тому що у модулі-хості (`Module1`) його оголошено на цьому рівні. Під час роботи з `Provider1`, його інстанси будуть створюватись окремо в обох модулях. Між модулями може бути спільним [одинак][3], тільки якщо його провайдер оголошено на рівні застосунку. В нашому прикладі провайдер оголошено на рівні модуля, тому у `Module1` та `Module2` інстанси `Provider1` не будуть спільними на жодному із рівнів.

Отже можна стверджувати, що імпортуються класи, а не їхні інстанси.

### Імпорт та інкапсуляція {#import-and-encapsulation}

Давайте розглянемо ситуацію, при якій з `Module1` експортується тільки `Provider3`, оскільки тільки цей провайдер використовується у зовнішніх модулях безпосередньо:

```ts
// ...
@restModule({
  providersPerMod: [Provider3, Provider2, Provider1],
  exports: [Provider3],
})
export class Module1 {}
```

Припустимо, що `Provider3` має залежність від `Provider1` та `Provider2`. Як буде діяти Ditsmod при імпорті даного модуля в інші модулі? Ditsmod імпортуватиме усі три провайдери, оскільки `Provider3` зележить від двох інших провайдерів.

## Прикріплення модуля {#appending-of-the-module}

Якщо вам не потрібно імпортувати провайдери та [розширення][2] в поточний модуль, а потрібно всього лиш прикріпити зовнішній модуль до path-префікса поточного модуля, можна скористатись масивом `appends`:

```ts {5}
import { restModule } from '@ditsmod/rest';
import { FirstModule } from './first.module.js';

@restModule({
  appends: [FirstModule]
})
export class SecondModule {}
```

В даному випадку, якщо `SecondModule` має  path-префікс, він буде використовуватись у якості префіксу для усіх маршрутів, що є у `FirstModule`. Прикріплятись можуть лише ті модулі, що мають контролери. 

Також можна закріпити додатковий path-префікс за `FirstModule`:

```ts {3}
// ...
@restModule({
  appends: [{ path: 'some-path', module: FirstModule }]
})
export class SecondModule {}
```

У даному прикладі був використаний об'єкт, в якому передається модуль для закріплення, він має наступний інтерфейс:

```ts
interface AppendsWithParams<T extends AnyObj = AnyObj> {
  id?: string;
  path: string;
  module: ModuleType<T>;
  guards?: GuardItem[];
}
```

## Реекспорт модуля {#re-export-of-the-module}

Окрім імпорту певного модуля, цей же модуль можна одночасно й експортувати:

```ts
import { restModule } from '@ditsmod/rest';
import { FirstModule } from './first.module.js';

@restModule({
  imports: [FirstModule],
  exports: [FirstModule],
})
export class SecondModule {}
```

Який у цьому сенс? - Тепер, якщо ви зробите імпорт `SecondModule` у якийсь інший модуль, ви фактично матимете імпортованим ще й `FirstModule`.

Зверніть увагу! Якщо під час реекспорту ви імпортуєте об'єкт з інтерфейсом `ModuleWithParams`, цей же об'єкт потрібно й експортувати:

```ts
import { ModuleWithParams } from '@ditsmod/core';
import { restModule, RestModuleParams } from '@ditsmod/rest';

import { FirstModule } from './first.module.js';

const firstModuleWithParams: ModuleWithParams & RestModuleParams = { path: 'some-path', module: FirstModule };

@restModule({
  imports: [firstModuleWithParams],
  exports: [firstModuleWithParams],
})
export class SecondModule {}
```


[1]: /basic-components-of-the-app/dependency-injection#injector-and-providers
[2]: /basic-components-of-the-app/extensions
[3]: https://uk.wikipedia.org/wiki/%D0%9E%D0%B4%D0%B8%D0%BD%D0%B0%D0%BA_(%D1%88%D0%B0%D0%B1%D0%BB%D0%BE%D0%BD_%D0%BF%D1%80%D0%BE%D1%94%D0%BA%D1%82%D1%83%D0%B2%D0%B0%D0%BD%D0%BD%D1%8F) "Singleton"
