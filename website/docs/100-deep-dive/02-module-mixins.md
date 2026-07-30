---
sidebar_position: 2
---

# Mixin-декоратори та module mixins

:::warning
Якщо для передачі метаданих до модуля ви легко можете обійтись [динамічним модулем][1], в такому разі не рекомендується створювати mixin-декоратор. Тобто, кожен раз, коли ви хочете створити mixin-декоратор, спочатку оцініть можливість використання [динамічним модулем][1].
:::

Mixin-декоратори застосовуються до класів модулів, щоб передавати метадані з розширеними типами даних. Mixin-декоратори можуть виступати в трьох ролях:

1. Як декоратор для оголошення **кореневого модуля**, що має розширений тип даних відносно декоратора `rootModule`. Наприклад, `restRootModule` - це mixin-декоратор.
2. Як декоратор для оголошення **модуля фіч**, що має розширений тип даних відносно декоратора `featureModule`. Наприклад, `restModule` - це mixin-декоратор.
3. Як декоратор для розширення вже оголошеного **кореневого модуля**, чи **модуля фіч**. В такому разі рекомендується давати ім'я декоратору з префіксом `mixin*`, наприклад `mixinRest`, `mixinTrpc`, `mixinGraphql` і т.п. В цій ролі, зразу декілька mixin-декораторів можна застосовувати до одного класу модуля.

Оскільки mixin-декоратори приймають метадані модуля з розширеним типом, вони повинні мати можливість нормалізувати ці метадані, а також робити їхню валідацію. Це можна зробити через так звані **module mixins**, які передаються у трансформерах під час створення декораторів класу. Кожен трансформер, що використовується для mixin-декоратора, повинен повертати інстанс класу, який розширює `ModuleMixin`:

```ts {46,50}
import {
  ModuleMixin,
  MixinDecorator,
  Reflector,
  MixinOptions,
  DynamicModuleOptions,
  BaseNormalizedModuleMeta,
  NormalizedModuleMeta,
  RootDecoratorOptions,
} from '@ditsmod/core';
// ...

/**
 * Об'єкт цього типу буде передано безпосередньо mixin-декоратору - @mixinSome({ one: 1, two: 2 })
 */
interface ExtMixinDecorOpts extends MixinOptions<MixinOpts> {
  one?: number;
  two?: number;
}

/**
 * Методи цього класу нормалізуватимуть та перевірятимуть метадані модуля.
 */
class SomeModuleMixin extends ModuleMixin<ExtMixinDecorOpts> {
  // ...
}

/**
 * Об'єкт цього типу буде передано в метаданих модуля як так званий "динамічний модуль".
 */
interface MixinOpts extends DynamicModuleOptions {
  path?: string;
  num?: number;
}

/**
 * Module mixins трансформують об'єкт ExtMixinDecorOpts на об'єкт цього типу.
 */
interface MixinMeta extends BaseNormalizedModuleMeta {
  normalizedModuleMeta: NormalizedModuleMeta;
  mixinDecoratorOptions: RootDecoratorOptions;
}

function transformMixinOptions(data?: ExtMixinDecorOpts): ModuleMixin<ExtMixinDecorOpts> {
  const metadata = Object.assign({}, data);
  const moduleMixin = new SomeModuleMixin(metadata);
  moduleMixin.moduleRole = undefined;
  // OR moduleMixin.moduleRole = 'root';
  // OR moduleMixin.moduleRole = 'feature';
  return moduleMixin;
}

// Створення mixin-декоратора
const mixinSome: MixinDecorator<ExtMixinDecorOpts, MixinOpts, MixinMeta> = Reflector.makeClassDecorator(transformMixinOptions);

// Використання mixin-декоратора
@mixinSome({ one: 1, two: 2 })
export class SomeModule {}
```

[Готовий приклад створення mixin-декоратора][2] можна знайти в тестах репозиторія Ditsmod. Окрім цього, можна проглянути на більш складний, але і більш повний приклад [створення mixin-декораторів (restRootModule, restModule та mixinRest)][3], які знаходяться у модулі `@ditsmod/rest`.

## Взаємодія з кореневим модулем та модулем фіч {#interaction-with-root-and-feature-modules}

Залежно від ролі, визначеної через властивість `moduleRole` класу `ModuleMixin` (що повертається функцією-трансформером), mixin-декоратори взаємодіють з базовими декораторами (`rootModule` та `featureModule`) по-різному:

- **Декоратори-замінники** (`moduleRole` дорівнює `'root'` або `'feature'`): Ці декоратори виступають як повноцінні декоратори модулів. Клас, анотований ними (наприклад, `@restRootModule` або `@restModule`), не потребує додаткового використання `@featureModule` чи `@rootModule`. Фреймворк автоматично розпізнає їхню роль і опрацьовує їх.
- **Декоратори-модифікатори** (`moduleRole` дорівнює `undefined`): Ці декоратори лише модифікують/розширюють метадані. Клас, анотований ними (наприклад, `@mixinRest`), **обов'язково** повинен мати базовий декоратор модуля (або декоратор-замінник). Якщо базовий декоратор модуля відсутній, фреймворк кине помилку `MissingModuleDecorator`.

Кілька декораторів-модифікаторів можна застосовувати одночасно до одного класу модуля (наприклад, для додавання метаданих REST або tRPC до одного й того самого модуля).

## Групування mixin-декораторів через `decoratorId` {#grouping-mixin-decorators}

При створенні декоратора-замінника (з роллю `'root'` або `'feature'`) за допомогою `Reflector.makeClassDecorator()`, ви **обов'язково** повинні передати базовий декоратор-модифікатор (наприклад, `mixinRest` або `mixinSome`) як третій аргумент. Цей третій аргумент працює як `decoratorId`. Він вказує Ditsmod, що ці декоратори належать до однієї групи, дозволяючи фреймворку правильно збирати, нормалізувати та пов'язувати метадані з відповідним контекстом групи під час ініціалізації.

## Кастомізація ModuleMixin {#customizing-inithooks}

Базовий клас `ModuleMixin` надає кілька властивостей життєвого циклу та методів, які ви можете перевизначити для керування обробкою метаданих:

### Життєві цикли та властивості {#lifecycles-and-properties}

- `moduleRole?: 'root' | 'feature'`: Визначає, чи поводиться декоратор як заміна для `@rootModule` чи `@featureModule`.
- `hostModule?: ModuleType`: Клас модуля для автоматичного імпорту. Коли декоратор застосовується до будь-якого класу, вказаний `hostModule` автоматично додається до його масиву `imports` (якщо він там ще не присутній).
- `hostMixinOptions?: T`: Опції, які передаються як параметри міксіна для хост-модуля. Це дозволяє прикріпити метадані до класу хост-модуля без його безпосереднього декорування, що запобігає можливим циклічним залежностям.
- `normalize(normalizedModuleMeta)`: Валідує та нормалізує опції декоратора, повертаючи структурований об'єкт метаданих, який зберігається у `normalizedModuleMeta.mixinMeta`.
- `getModulesToScan(meta)`: Повертає масив класів/посилань на модулі, які також потрібно відсканувати (наприклад, додані (appended) модулі в REST).
- `exportAppProviders(config)`: Викликається під час завантаження для збору та експорту провайдерів рівня застосунку.
- `importModulesShallow(config)`: Викликається під час кроку поверхневого імпорту для сканування маршрутів, шляхів, контролерів та гардів.
- `importModulesDeep(config)`: Викликається під час кроку глибокого імпорту для вирішення залежностей провайдерів.
- `getProvidersToOverride(meta)`: Повертає масив масивів провайдерів, які можна перевизначити (наприклад, для тестування).

### Відокремлення модуля фіч від mixin-декоратора за допомогою hostModule {#separation-of-feature-module-and-mixin-decorator-using-hostmodule}

Відокремлення оголошення mixin-декораторів від хост-модуля фіч є необхідністю для уникнення циклічних залежностей (оскільки декоратор імпортує модуль, а декорування хост-модуля ним самим створило б цикл імпорту):

1. Спочатку створіть стандартний модуль фіч (наприклад, `MyLibModule`), що містить усі необхідні розширення, дефолтні провайдери та сервіси.
2. Потім оголосіть свій кастомний підклас `ModuleMixin`, встановивши `override hostModule = MyLibModule`.
3. Створіть базовий декоратор-модифікатор `mixin*` (наприклад, `mixinMy`), який слугуватиме у якості ID для групи декораторів.
4. Створіть функцію-трансформатор, яка повертає інстанс хуків і встановлює `hooks.moduleRole = 'feature'` (або `'root'`).
5. Створіть декоратор-замінник (наприклад, `myFeatureModule`) за допомогою `Reflector.makeClassDecorator()`, передавши трансформатор першим аргументом, ім'я другим, а базовий декоратор-модифікатор (`mixinMy`) третім аргументом (як батьківський).
6. Коли розробники застосовуватимуть цей декоратор (наприклад, `@myFeatureModule`), фреймворк розпізнаватиме його як декоратор модуля (потребуючи лише одного декоратора на класі замість двох) та автоматично імпортуватиме `MyLibModule`.

Ось приклад:

```ts
import { featureModule, ModuleMixin, Reflector } from '@ditsmod/core';

// 1. Стандартний модуль, що містить реальну логіку/провайдери
@featureModule({
  providersPerReq: [MyService],
  exports: [MyService],
})
export class MyLibModule {}

// 2. Кастомні хуки, що встановлюють hostModule
class MyModuleMixin extends ModuleMixin {
  override hostModule = MyLibModule;
}

// 3. Створення базового декоратора-модифікатора (служить батьківським декоратором групи)
export const mixinMy = Reflector.makeClassDecorator((data) => new MyModuleMixin(data), 'mixinMy');

// 4. Створення трансформатора, який встановлює moduleRole = 'feature'
function transformFeatureMeta(data?: any) {
  const hooks = new MyModuleMixin(data);
  hooks.moduleRole = 'feature'; // Робить його декоратором-замінником модуля
  return hooks;
}

// 5. Створення декоратора-замінника, передаючи mixinMy як 3-й аргумент
export const myFeatureModule = Reflector.makeClassDecorator(transformFeatureMeta, 'myFeatureModule', mixinMy);

// 6. Використання лише одного декоратора на класі (автоматично імпортує MyLibModule)
@myFeatureModule()
export class MyFeatureModule {}
```

## Опції імпортованих динамічних модулів {#imported-dynamic-module-options}

Під час імпорту динамічного модуля в контексті mixin-декоратора:

1. Кастомні параметри (такі як `path` або `guards`) автоматично додаються в Map `dynamicModule.mixinOptions` під токен-ключем декоратора.
2. Якщо імпортований модуль має лише `@featureModule` (без mixin-декораторів), фреймворк отримує дефолтний клас хуків для цього декоратора з контексту застосунку, клонує його, реєструє у `moduleMixinMap` модуля та викликає метод `normalize()`.
3. Це забезпечує коректну обробку кастомних опцій (таких як REST префікси маршрутів та гарди), навіть при імпорті стандартних модулів фіч, які не мають кастомних анотацій mixin-декораторів.

[1]: /basic-components/modules/#DynamicModule
[2]: https://github.com/ditsmod/ditsmod/blob/3.0.0-next.15/packages/core/src/init/module-normalizer.spec.ts#L333-L531
[3]: https://github.com/ditsmod/ditsmod/blob/3.0.0-next.15/packages/rest/src/decorators/rest-module-mixins.ts
