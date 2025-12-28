---
sidebar_position: 3
---

# Ініт-декоратори та ініт-хуки

:::warning
Якщо для передачі метаданих до модуля ви легко можете обійтись [модулем з параметрами][1], в такому разі не рекомендується створювати ініт-декоратор. Тобто, кожен раз, коли ви хочете створити ініт-декоратор, спочатку оцініть можливість використання [модуля з параметрами][1].
:::

Ініт-декоратори застосовуються до класів модулів, щоб передавати метадані з розширеними типами даних. Ініт-декоратори можуть виступати в трьох ролях:

1. Як декоратор для оголошення **кореневого модуля**, що має розширений тип даних відносно декоратора `rootModule`. Наприклад, `restRootModule` - це ініт-декоратор.
2. Як декоратор для оголошення **модуля фіч**, що має розширений тип даних відносно декоратора `featureModule`. Наприклад, `restModule` - це ініт-декоратор.
3. Як декоратор для розширення вже оголошеного **кореневого модуля**, чи **модуля фіч**. В такому разі рекомендується давати ім'я декоратору з префіксом `init*`, наприклад `initRest`, `initTrpc`, `initGraphql` і т.п. В цій ролі, зразу декілька ініт-декораторів можна застосовувати до одного класу модуля.

Оскільки ініт-декоратори приймають метадані модуля з розширеним типом, вони повинні мати можливість нормалізувати ці метадані, а також робити їхню валідацію. Це можна зробити через так звані **ініт-хуки**, які передаються у трансформерах під час створення декораторів класу. Кожен трансформер, що використовується для ініт-декоратора, повинен повертати інстанс класу, який розширює `InitHooks`:

```ts {47,51}
import {
  InitHooks,
  InitDecorator,
  makeClassDecorator,
  BaseInitRawMeta,
  FeatureModuleParams,
  BaseInitMeta,
  BaseMeta,
  RootRawMetadata,
} from '@ditsmod/core';
// ...

/**
 * An object with this type will be passed directly to the init decorator.
 */
interface RawMetadata extends BaseInitRawMeta<InitParams> {
  one?: number;
  two?: number;
}

/**
 * The methods of this class will normalize and validate the module metadata.
 */
class SomeInitHooks extends InitHooks<RawMetadata> {
  // ...
}

/**
 * An object with this type will be passed in the module metadata as a so-called "module with parameters".
 */
interface InitParams extends FeatureModuleParams {
  path?: string;
  num?: number;
}

/**
 * Init hooks transform an object of type {@link RawMetadata} into an object of that type.
 */
interface InitMeta extends BaseInitMeta {
  baseMeta: BaseMeta;
  rawMeta: RootRawMetadata;
}

// Init decorator transformer
function getInitHooks(data?: RawMetadata): InitHooks<RawMetadata> {
  const metadata = Object.assign({}, data);
  const initHooks = new SomeInitHooks(metadata);
  initHooks.moduleRole = undefined;
  // OR initHooks.moduleRole = 'root';
  // OR initHooks.moduleRole = 'feature';
  return initHooks;
}

// Creating the init decorator
const initSome: InitDecorator<RawMetadata, InitParams, InitMeta> = makeClassDecorator(getInitHooks);

// Using init decorator
@initSome({ one: 1, two: 2 })
export class SomeModule {}
```

[Готовий приклад створення ініт-декоратора][2] можна знайти в тестах репозиторія Ditsmod. Окрім цього, можна проглянути на більш складний, але і більш повний приклад [створення ініт-декораторів (restRootModule, restModule та initRest)][3], які знаходяться у модулі `@ditsmod/rest`.

[1]: /developer-guides/exports-and-imports/#ModuleWithParams
[2]: https://github.com/ditsmod/ditsmod/blob/168a9fe0712b5bedc5649908c4ada5158c956174/packages/core/src/init/module-normalizer.spec.ts#L282-L475
[3]: https://github.com/ditsmod/ditsmod/blob/168a9fe0712b5bedc5649908c4ada5158c956174/packages/rest/src/decorators/rest-init-hooks-and-metadata.ts
