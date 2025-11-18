---
sidebar_position: 0
---

# Декоратори та рефлектор {#decorators-and-reflector}

Давайте почнемо з очевидного - TypeScript-синтаксис частково відрізняється від JavaScript-синтаксису, бо має можливості для статичної типізації. Під час компіляції TypeScript-коду у JavaScript-код компілятор може надати додатковий JavaScript-код, який можна використовувати для отримання інформації про статичні типи властивостей класу, або статичні типи параметрів у методах класу. Тобто, працючи з TypeScript-кодом, спочатку можна вказувати статичні типи в класах, а потім звертаючись до спеціального API можна використовувати інформацію про ці статичні типи вже у JavaScript-коді. Декоратори сигналізують TypeScript-компілятору, що потрібно вивантажувати інформацію про статичні типи класу, а рефлектор зберігає та видає цю інформацію.

Окрім статичних TypeScript-типів, декоратори також дозволяють зберігати додаткові метадані, які можна передавати у декоратори на рівні класу, властивостей класу, або параметрів методу.

У Ditsmod, декоратори та рефлектор є фундаментальними компонентами, які використовуються постійно, і які дозволяють декларативно описувати застосунок. Саме тому вивчення Dismod треба починати з цієї теми.

Давайте спробуємо проекспериментувати зі збереженням статичних типів класу. Створіть файл `src/app/services.ts` в репозиторію [ditsmod/rest-starter][101], та вставте у нього наступний код:

```ts
class Service1 {}

class Service2 {
  constructor(service1: Service1) {}
}
```

Як бачите, в конструкторі `Service2` вказано статичний тип даних для параметра `service1`. Якщо запустити команду:

```bash
npm run build
```

TypeScript-код скомпілюється і попаде у файл `dist/app/services.js`. Він матиме такий вигляд:

```ts
class Service1 {
}
class Service2 {
    constructor(service1) { }
}
```

Тобто інформація про тип параметра в конструкторі `Service2` втрачена. Але якщо ми використаємо декоратор класу, TypeScript-компілятор вивантажить більше JavaScript-коду з інформацією про статичну типізацію. Наприклад, давайте скористаємось декоратором `injectable`:

```ts {1,5}
import { injectable } from '@ditsmod/core';

class Service1 {}

@injectable()
class Service2 {
  constructor(service1: Service1) {}
}
```

Тепер за допомогою команди `npm run build` TypeScript-компілятор перетворює цей код на наступний JavaScript-код і вставляє його у `dist/app/services.js`:

```js {18}
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { injectable } from '@ditsmod/core';
class Service1 {
}
let Service2 = class Service2 {
    constructor(service1) { }
};
Service2 = __decorate([
    injectable(),
    __metadata("design:paramtypes", [Service1])
], Service2);
```

На щастя, проглядати теку `dist` та аналізувати скомпільований код вам навряд чи прийдеться часто, але для загального уявлення про механізм перенесення статичної типізації у JavaScript-код, інколи буває корисним глянути на нього. Найцікавіша частина знаходиться в останніх чотирьох рядках. Очевидно, що TypeScript-компілятор тепер пов'язує масив `[Service1]` із `Service2`. Цей масив - це і є інформація про статичні типи параметрів, знайдені компілятором в конструкторі `Service2`.

Подальший аналіз скомпільованого коду вказує нам, що для збереження метаданих зі статичною типізацію використовується клас `Reflect`. На початковому етапі ознайомлення з Ditsmod, вам можна не заглиблюватись в тему роботи `Reflect`, оскільки в Ditsmod є більш високорівневі інструменти, що спрощують роботу зі збереженням та використанням метаданих класів. На даному етапі достатньо почути, що `Reflect` імпортується з бібліотеки [reflect-metadata][13], а API даної бібліотеки потім використовується Ditsmod, щоб зчитувати вищенаведені метадані. Цим займається так званий **рефлектор**.

Давайте поглянемо, які високорівневі інструменти має Ditsmod для роботи з рефлектором. Ускладнимо попередній приклад, щоб побачити як можна витягувати метадані та формувати складні ланцюжки залежностей. Розглянемо три класи з наступною залежністю `Service3` -> `Service2` -> `Service1`. Вставте у `src/app/services.ts` наступний код:

```ts
import { injectable, getDependencies } from '@ditsmod/core';

class Service1 {}

@injectable()
class Service2 {
  constructor(service1: Service1) {}
}

@injectable()
class Service3 {
  constructor(service2: Service2) {}
}

console.log(getDependencies(Service3)); // [ { token: [class Service2], required: true } ]
```

Функція `getDependencies()` використовує рефлектор і повертає масив безпосередніх залежностей `Service3`. Мабуть ви здогадуєтесь, що передавши `Service2` до `getDependencies()`, ми побачимо залежність від `Service1`. Таким чином можна **автоматично** скласти весь ланцюжок залежностей `Service3` -> `Service2` -> `Service1`. Такий процес в DI називають "вирішенням залежностей". І тут слово "автоматично" спеціально виділено жирним шрифтом, бо це дуже важлива фіча, яку підтримує DI. Користувачі передають до DI всього лише `Service3`, і їм не треба вручну досліджувати від чого цей клас залежить, DI може вирішити залежність автоматично. До речі, користувачам навряд чи прийдеться користуватись функцією `getDependencies()`, за виключенням окремих рідких випадків.

Строго кажучи, механізм збереження та отримання метаданих від рефлектора за допомогою декораторів - це ще не Dependecy Injection. Але Dependecy Injection широко використовує декоратори та рефлектор у своїй роботі, тому інколи в цій документації може говоритись, що DI отримує інформацію про залежності класу, хоча насправді за це відповідає рефлектор.

Код в останньому прикладі можна скомпілювати та запустити наступною командою:

```bash
tput reset && npm run build && node dist/app/services.js
```

Щоб після кожної зміни код автоматично виконувався, можна скористатись двома терміналами. У першому терміналі можна запустити команду для компіляції коду:

```bash
npm run build -- --watch
```

А в другому терміналі можна запустити команду для запуску скопільованого коду:

```bash
node --watch dist/app/services.js
```

Тепер, якщо у `src/app/services.ts`, у функцію `getDependencies()` передати `Service2`, через пару секунд у другому терміналі ви повинні побачити вивід `[ { token: [class Service1], required: true } ]`.


[13]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/package.json#L53
[14]: https://github.com/tc39/proposal-decorators

[101]: ../../#installation
