---
slug: /
sidebar_position: 1
---

# Що таке Ditsmod

## Ознайомлення з Ditsmod

Ditsmod є Node.js веб-фреймворком, його назва складається із **DI** + **TS** + **Mod**, щоб підкреслити важливі складові: він має **D**ependency **I**njection, написаний на **T**ype**S**cript, та спроектований для хорошої **Мод**ульності.

Головні особливості Ditsmod:

- Модульна архітектура на декораторах, що дозволяє декларативно описувати структуру застосунку.
- Зручний механізм [указання та вирішення залежностей][8] між різними класами: ви в конструкторі указуєте інстанси яких класів вам потрібні, а DI бере на себе непросту задачу "як їх отримати".
- Можливість написання власних розширень (інколи їх називають плагінами), що можуть асинхронно ініціалізуватись, і що можуть залежати один від одного.
- Можливість динамічно додавати та видаляти модулі після старту вебсервера, без необхідності рестарту.
- Має підтримку OpenAPI, та має можливість проводити валідацію запитів на основі метаданих OpenAPI.
- На сьогодішній день, [Ditsmod є одним із найшвидших][14] серед Node.js веб фреймворків.

Деякі концепції архітектури Ditsmod взяті з [Angular][9] концепцій, а DI побудована на базі нативного модуля Angular DI.

## Попередні умови

Будь-ласка, переконайтесь що на вашій операційній системі встановлено Node.js >= v18.14.0.

## Встановлення

Базовий набір для роботи застосунку має репозиторій [ditsmod/seed][2]. Клонуйте його та встановіть залежності:

```bash
git clone --depth 1 https://github.com/ditsmod/seed.git my-app
cd my-app
npm i
```

У якості альтернативи, ви можете скористатись стартовим монорепозиторієм:

```bash
git clone --depth 1 https://github.com/ditsmod/monorepo.git my-app
cd my-app
npm i
```

## Запуск в режимі розробки

Для режиму розробки вам потрібно два термінали. В одному буде компілюватись TypeScript-код у JavaScript-код, а у другому - запускатиметься вебсервер, який після кожної зміни коду підхвачуватиме ці зміни та перезавантажуватиметься.

Команда для першого терміналу:

```bash
npm run watch
```

Команда для другого терміналу:

```bash
npm start
```

Перевірити роботу сервера можна за допомогою `curl`:

```bash
curl -i localhost:3000
```

Або просто перейшовши у браузері на [http://localhost:3000/](http://localhost:3000/).

Звичайно ж, замість двох терміналів можна використовувати, наприклад, [ts-node][17] в одному терміналі, але це повільніший варіант, бо після кожної зміни `ts-node` буде перекомпільовувати увесь код на льоту заново, тоді як у режимі `tsc -w` перекомпільовується лише змінений файл. Окрім цього, завдяки використанню у [ditsmod/seed][2] так званих [Project References][16] і режиму збірки `tsc -b`, навіть дуже великі проекти компілюються дуже швидко.

Зверніть увагу, що у репозиторії `ditsmod/seed` є чотири конфіг-файли для TypeScript:

- `tsconfig.json` - базова конфігурація, що використовується вашою IDE (у більшості це мабуть VS Code).
- `tsconfig.build.json` - ця конфігурація використовується для компіляції коду з теки `src` у теку `dist`, вона призначається для коду застосунку.
- `tsconfig.test.json` - ця конфігурація використовується для компіляції коду end-to-end тестів.
- `tsconfig.utin.json` - ця конфігурація використовується для компіляції коду юніт-тестів.

Окрім цього, зверніть увагу, що завдяки тому, що `ditsmod/seed` оголошено як EcmaScript Module (ESM), для скорочення шляху до файлів ви можете використовувати [нативні аліаси Node.js][18]. Це аналог `compilerOptions.paths` у `tsconfig`. Такі аліаси оголошуються у `package.json` у полі `imports`:

```json {2}
"imports": {
  "#app/*": "./dist/app/*"
},
```

Тепер ви можете використовувати його, наприклад у теці `test`, ось так:

```ts
import { AppModule } from '#app/app.module.js';
```

На даний момент (2023-10-13) TypeScript ще не у повній мірі підтримує ці аліаси, тому бажано їх продублювати у файлі `tsconfig.json`:

```json
// ...
  "paths": {
    "#app/*": ["./src/app/*"]
  }
// ...
```

У інших `tsconfig`-файлах немає сенсу це робити, бо він потрібен лише для вашого редактора коду. Зверніть увагу, що у `package.json` аліаси вказують на `dist`, тоді як у `tsconfig.json` - на `src`.

## Запуск в продуктовому режимі

Компіляція застосунку та запуск сервера в продуктовому режимі відбувається за допомогою команди:

```bash
npm run build
npm run start-prod
```

Більше прикладів застосунку є у теці [examples][4], а також у репозиторію [RealWorld][13].

## Вхідний файл для Node.js

Після [встановлення Ditsmod seed][1], перше, що необхідно знати: весь код застосунку знаходиться у теці `src`, він компілюється за допомогою TypeScript-утиліти `tsc`, після компіляції попадає у теку `dist`, і далі вже у вигляді JavaScript-коду його можна виконувати у Node.js.

Давайте розглянемо файл `src/main.ts`:

```ts
import { Application } from '@ditsmod/core';
import { AppModule } from './app/app.module.js';

const app = await new Application().bootstrap(AppModule);
app.server.listen(3000, '0.0.0.0');
```

Після компіляції, він перетворюється на `dist/main.js` та стає вхідною точкою для запуску застосунку у продуктовому режимі, і саме тому ви будете його вказувати у якості аргументу для Node.js:

```bash
node dist/main.js
```

Проглядаючи файл `src/main.ts`, ви можете бачити, що створюється інстанс класу `Application`, а у якості аргументу для методу `bootstrap()` передається `AppModule`. Тут `AppModule` є кореневим модулем, до якого вже підв'язуються інші модулі застосунку.


[1]: #встановлення
[2]: https://github.com/ditsmod/seed
[4]: https://github.com/ditsmod/ditsmod/tree/main/examples
[8]: https://uk.wikipedia.org/wiki/%D0%92%D0%BF%D1%80%D0%BE%D0%B2%D0%B0%D0%B4%D0%B6%D0%B5%D0%BD%D0%BD%D1%8F_%D0%B7%D0%B0%D0%BB%D0%B5%D0%B6%D0%BD%D0%BE%D1%81%D1%82%D0%B5%D0%B9
[9]: https://github.com/angular/angular
[10]: https://jestjs.io/en/
[12]: https://uk.wikipedia.org/wiki/%D0%9E%D0%B4%D0%B8%D0%BD%D0%B0%D0%BA_(%D1%88%D0%B0%D0%B1%D0%BB%D0%BE%D0%BD_%D0%BF%D1%80%D0%BE%D1%94%D0%BA%D1%82%D1%83%D0%B2%D0%B0%D0%BD%D0%BD%D1%8F) "Singleton"
[13]: https://github.com/ditsmod/realworld
[14]: https://github.com/ditsmod/vs-webframework#readme
[15]: https://github.com/remy/nodemon
[16]: https://www.typescriptlang.org/docs/handbook/project-references.html
[17]: https://github.com/TypeStrong/ts-node
[18]: https://nodejs.org/api/packages.html#imports
