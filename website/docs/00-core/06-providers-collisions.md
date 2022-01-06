---
sidebar_position: 6
---

# Колізії провайдерів

Уявіть, що у вас є `Module1`, куди ви імпортували `Module2` та `Module3`. Ви зробили
такий імпорт, бо вам потрібні відповідно `Service2` та `Service3` із цих модулів. Ви проглядаєте
результат роботи даних сервісів, але по якійсь причині `Service3` працює не так як очікується. Ви
починаєте дебажити і виявляється, що `Service3` експортують обидва модулі: `Module2` та `Module3`.
Ви очікували, що `Service3` експортуватиметься лише із `Module3`, але насправді спрацювала та
версія, що експортується із `Module2`.

Щоб цього не сталось, якщо ви імпортуєте два або більше модулі, в яких експортуються провайдери
з однаковим токеном, Ditsmod кидатиме приблизно таку помилку:

> Error: Importing providers to Module1 failed: exports from Module2 and Module3 causes collision with Service3. You should add this provider to resolvedCollisionsPer* in Module1. For example: resolvedCollisionsPerReq: [ [Service3, Module3] ].

Конкретно у цій ситуації:

1. і `Module2` підмінює, а потім експортує провайдер з токеном `Service3`;
2. і `Module3` підмінює, а потім експортує провайдер з токеном `Service3`.

І оскільки обидва цих модулі імпортуються у `Module1`, якраз тому і виникає "колізія провайдерів",
розробник може не знати яка із цих підмін буде працювати в `Module1`.

Враховуючи рівень, на якому оголошено провайдери, колізія вирішується шляхом додавання до `resolvedCollisionsPer*` масиву з двох елементів, де на першому місці йде токен провайдера, а на другому - модуль, з якого потрібно брати відповідний провайдер:

```ts
import { Module2 } from './module2';
import { Module3, Service3 } from './module3';

@Module({
  imports: [Module2, Module3],
  resolvedCollisionsPerReq: [ [Service3, Module3] ]
})
export class Module1 {}
```
