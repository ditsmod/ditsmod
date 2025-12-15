---
sidebar_position: 13
---

# Ініт-декоратори та ініт-хуки

Ініт-декоратори застосовуються до класів модулів, щоб передавати метадані з розширеними типами даних. Ініт-декоратори можуть виступати в трьох ролях:

1. Як декоратор для кореневого модуля (розширюючи тип даних, що передається в декоратор `rootModule`). Наприклад, `restRootModule` - це ініт-декоратор, в який можна передавати метадані з розширеним типом даних.
2. Як декоратор для модуля фіч (розширюючи тип даних, що передається в декоратор `featureModule`). Наприклад, `restModule` - це ініт-декоратор, в який можна передавати метадані з розширеним типом даних.
3. Як декоратор для розширення кореневого модуля, чи модуля фіч. В такому разі рекомендується давати ім'я декоратору з префіксом `init*`, наприклад `initRest`, `initTrpc`, `initGraphql` і т.п. В цій ролі, зразу декілька ініт-декораторів можна застосовувати до одного класу модуля.

Оскільки ініт-декоратори приймають метадані модуля з розширеним типом, вони повинні мати можливість нормалізувати ці метадані, а також робити їхню валідацію. Це можна зробити через так звані **ініт-хуки**, які передаються у трансформерах під час створення декораторів класу. Кожен трансформер, що використовується для ініт-декоратора, повинен повертати інстанс класу, який розширює `InitHooks`:

```ts {12,16}
import { InitHooks, InitDecorator, makeClassDecorator } from '@ditsmod/core';
// ...

// Методи цього класу будуть нормалізувати метадані модуля, а також робитимуть їхню валідацію
class SomeInitHooks extends InitHooks<SomeInitRawMeta> {
  // ...
}

// Трансформер ініт-декоратора
function getInitHooks(data?: RawMetadata): InitHooks<RawMetadata> {
  const metadata = Object.assign({}, data);
  const initHooks = new SomeInitHooks(metadata);
  initHooks.moduleRole = undefined;
  // OR initHooks.moduleRole = 'root';
  // OR initHooks.moduleRole = 'feature';
  return initHooks;
}

// Створення ініт-декоратора
const initSome: InitDecorator<RawMetadata, InitParams, InitMeta> = makeClassDecorator(getInitHooks);
```

[Готовий приклад створення ініт-декоратора][2] можна знайти в тестах репозиторія Ditsmod. Окрім цього, можна проглянути на більш складний, але і більш повний приклад [створення ініт-декораторів (restRootModule, restModule та initRest)][3], які знаходяться у модулі `@ditsmod/rest`.

:::warning
Якщо для передачі метаданих до модуля ви легко можете обійтись [модулем з параметрами][1], в такому разі не рекомендується створювати ініт-декоратор. Тобто, кожен раз, коли ви хочете створити ініт-декоратор, спочатку оцініть можливість використання [модуля з параметрами][1].
:::

[1]: /developer-guides/exports-and-imports/#ModuleWithParams
[2]: https://github.com/ditsmod/ditsmod/blob/168a9fe0712b5bedc5649908c4ada5158c956174/packages/core/src/init/module-normalizer.spec.ts#L282-L475
[3]: https://github.com/ditsmod/ditsmod/blob/168a9fe0712b5bedc5649908c4ada5158c956174/packages/rest/src/decorators/rest-init-hooks-and-metadata.ts
