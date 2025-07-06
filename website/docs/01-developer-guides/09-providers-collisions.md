---
sidebar_position: 9
---

# Колізії провайдерів

Колізії провайдерів виникають тоді, коли у поточний модуль імпортуються різні провайдери, що надають один і той самий сервіс.

Давайте розбиремо конкретний приклад. Уявіть, що у вас є `Module3`, куди ви імпортували `Module2` та `Module1`. Ви зробили такий імпорт, бо вам потрібні відповідно `Service2` та `Service1` із цих модулів. Ви проглядаєте результат роботи даних сервісів, але по якійсь причині `Service1` працює не так як очікується. Ви починаєте дебажити і виявляється, що `Service1` експортується з обох модулів: `Module2` та `Module1`. Ви очікували, що `Service1` експортуватиметься лише з `Module1`, але насправді спрацювала та версія, що експортується з `Module2`:

```ts {8,14,19}
import { featureModule, rootModule } from '@ditsmod/core';

class Service1 {}
class Service2 {}

@featureModule({
  providersPerMod: [Service1],
  exports: [Service1]
})
class Module1 {}

@featureModule({
  providersPerMod: [{ token: Service1, useValue: 'some value' }, Service2],
  exports: [Service1, Service2],
})
class Module2 {}

@rootModule({
  imports: [Module1, Module2],
})
class Module3 {}
```

Щоб цього не сталось, якщо ви імпортуєте два або більше модулі, в яких експортуються неідентичні провайдери з однаковим токеном, Ditsmod кидатиме приблизно таку помилку:

> Error: Importing providers to Module3 failed: exports from Module1, Module2 causes collision with Service1. You should add Service1 to resolvedCollisionsPerMod in this module. For example: resolvedCollisionsPerMod: [ [Service1, Module1] ].

Конкретно у цій ситуації:

1. і `Module1` експортує провайдер з токеном `Service1`;
2. і `Module2` підмінює, а потім експортує провайдер з токеном `Service1`;
3. провайдери з токеном `Service1` є неідентичними у `Module1` та `Module2`.

І оскільки обидва ці модулі імпортуються у `Module3`, якраз тому і виникає "колізія провайдерів", розробник може не знати який провайдер буде працювати в `Module3`.

## Вирішення колізії

Якщо `Module3` оголошено у вашому застосунку (тобто не імпортовано з `node_modules`), колізія вирішується шляхом додавання до `resolvedCollisionsPer*` масиву з двох елементів, де на першому місці йде токен провайдера, а на другому - модуль, з якого потрібно брати відповідний провайдер:

```ts {20}
import { featureModule, rootModule } from '@ditsmod/core';

class Service1 {}
class Service2 {}

@featureModule({
  providersPerMod: [Service1],
  exports: [Service1]
})
class Module1 {}

@featureModule({
  providersPerMod: [{ token: Service1, useValue: 'some value' }, Service2],
  exports: [Service1, Service2],
})
class Module2 {}

@rootModule({
  imports: [Module1, Module2],
  resolvedCollisionsPerMod: [ [Service1, Module1] ]
})
class Module3 {}
```

Якщо `Module3` ви встановили за допомогою менеджера пакетів (npm, npm run і т.д.), немає сенсу локально змінювати цей модуль щоб вирішити колізію. Така ситуація може виникнути лише якщо `Module1` та `Module2` експортуються з кореневого модуля, тому вам потрібно видалити один із цих модулів звідти. Ну і, звичайно ж, після цього вам прийдеться явно імпортувати видалений модуль у ті модулі, де він необхідний.
