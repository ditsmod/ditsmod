---
slug: /
sidebar_position: 1
---

# Що таке Ditsmod

## Ознайомлення з Ditsmod

Ditsmod - це веб-фреймворк на базі Node.js, призначений для створення добре-розширюваних та швидких застосунків, його назва складається з **DI** + **TS** + **Mod**, щоб підкреслити важливі складові: він має **D**ependency **I**njection, написаний на **T**ype**S**cript у форматі ESM, та спроектований для хорошої **Мод**ульності.

Головні особливості Ditsmod:

- **Модульна архітектура** на декораторах, що дозволяє декларативно описувати структуру застосунку.
- Можливість написання власних розширень (інколи їх називають плагінами), що можуть асинхронно ініціалізуватись, і що можуть залежати один від одного.
- Можливість динамічно додавати та видаляти модулі після старту вебсервера, без необхідності рестарту.
- Має підтримку **OpenAPI**, та має можливість проводити валідацію запитів на основі метаданих OpenAPI.
- На сьогодішній день, [Ditsmod є одним із найшвидших серед Node.js веб фреймворків][14]:

![Techempower benchmarks](/img/tech-empower-benchmarks.png)

Деякі концепції архітектури Ditsmod взяті з [Angular][9] концепцій, а DI побудована на базі нативного модуля Angular DI.

### ExpressJS vs. Ditsmod

Для порівняння, в наступних двох прикладах показано мінімальний код для запуску ExpressJS та Ditsmod застосунків.

```js
import express from 'express';
const app = express();

app.get('/hello', function (req, res) {
  res.send('Hello, World!');
});

app.listen(3000, '0.0.0.0');
```

```ts
import { controller, rootModule, Application } from '@ditsmod/core';
import { route, RoutingModule } from '@ditsmod/routing';

@controller()
class ExampleController {
  @route('GET', 'hello')
  tellHello() {
    return 'Hello, World!';
  }
}

@rootModule({
  imports: [RoutingModule],
  controllers: [ExampleController],
})
class AppModule {}

const app = await Application.create(AppModule);
app.server.listen(3000, '0.0.0.0');
```

Оцінюючи об'єм коду, можна припустити, що через свою багатослівність, Ditsmod є повільнішим за ExpressJS. Але насправді трохи повільнішим є лише холодний старт Ditsmod (на моєму ноутбуку він стартує за 34 ms, тоді як ExpressJS стартує за 4 ms). Що стосується швидкості обробки запитів, то [Ditsmod більш ніж удвічі швидший за ExpressJS][14].

Більше прикладів застосунку є у репозиторію [Ditsmod][4], а також у репозиторію [RealWorld][13].

P.S. Хоча нижче надано лінк на репозиторій з усіма необхідними налаштуваннями для Ditsmod-застосунків, але, все ж таки, якщо ви захочете використати лише цей код, незабудьте у tsconfig-файлах прописати наступне:

```json {4-5}
{
  "compilerOptions": {
    // ...
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Попередні умови

Будь-ласка, переконайтесь що на вашій операційній системі встановлено Node.js >= v20.6.0.

## Встановлення

Базовий набір для роботи застосунку має репозиторій [ditsmod/starter][2]. Клонуйте його та встановіть залежності:

```bash
git clone --depth 1 https://github.com/ditsmod/starter.git my-app
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

Стартувати застосунок в режимі розробки можна наступною командою:

```bash
npm run start:dev
```

Перевірити роботу сервера можна за допомогою `curl`:

```bash
curl -i localhost:3000/api/hello
```

Або просто перейшовши у браузері на [http://localhost:3000/api/hello](http://localhost:3000/api/hello).

По дефолту, застосунок працює з деталізацією log level на рівні `info`. Змінити його можна у файлі `src/app/app.module.ts` або `apps/backend/src/app/app.module.ts` (у монорепозиторію).

Завдяки використанню у [ditsmod/starter][2] так званих [Project References][16] і режиму збірки `tsc -b`, навіть дуже великі проекти компілюються дуже швидко.

Зверніть увагу, що у репозиторії `ditsmod/starter` є чотири конфіг-файли для TypeScript:

- `tsconfig.json` - базова конфігурація, що використовується вашою IDE (у більшості це мабуть VS Code).
- `tsconfig.build.json` - ця конфігурація використовується для компіляції коду з теки `src` у теку `dist`, вона призначається для коду застосунку.
- `tsconfig.e2e.json` - ця конфігурація використовується для компіляції коду end-to-end тестів.
- `tsconfig.unit.json` - ця конфігурація використовується для компіляції коду юніт-тестів.

Окрім цього, зверніть увагу, що завдяки тому, що `ditsmod/starter` оголошено як EcmaScript Module (ESM), для скорочення шляху до файлів ви можете використовувати [нативні аліаси Node.js][18]. Це аналог `compilerOptions.paths` у `tsconfig`. Такі аліаси оголошуються у `package.json` у полі `imports`:

```json {2}
"imports": {
  "#app/*": "./dist/app/*"
},
```

Тепер ви можете використовувати його, наприклад у теці `e2e`, ось так:

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

Зверніть увагу, що у `package.json` аліаси вказують на `dist`, тоді як у `tsconfig.json` - на `src`.

## Запуск в продуктовому режимі

Компіляція застосунку та запуск сервера в продуктовому режимі відбувається за допомогою команди:

```bash
npm run build
npm run start-prod
```

## Вхідний файл для Node.js

Після [встановлення Ditsmod starter][1], перше, що необхідно знати: весь код застосунку знаходиться у теці `src`, він компілюється за допомогою TypeScript-утиліти `tsc`, після компіляції попадає у теку `dist`, і далі вже у вигляді JavaScript-коду його можна виконувати у Node.js.

Давайте розглянемо файл `src/main.ts`:

```ts
import { ServerOptions } from 'node:http';
import { Application } from '@ditsmod/core';

import { AppModule } from './app/app.module.js';
import { checkCliAndSetPort } from './app/utils/check-cli-and-set-port.js';

const serverOptions: ServerOptions = { keepAlive: true, keepAliveTimeout: 5000 };
const app = await Application.create(AppModule, { serverOptions, path: 'api' });
const port = checkCliAndSetPort(3000);
app.server.listen(port, '0.0.0.0');
```

Після компіляції, він перетворюється на `dist/main.js` та стає вхідною точкою для запуску застосунку у продуктовому режимі, і саме тому ви будете його вказувати у якості аргументу для Node.js:

```bash
node dist/main.js
```

Проглядаючи файл `src/main.ts`, ви можете бачити, що створюється інстанс класу `Application`, а у якості аргументу для методу `bootstrap()` передається `AppModule`. Тут `AppModule` є кореневим модулем, до якого вже підв'язуються інші модулі застосунку.

## Ditsmod на Bun

Ditsmod може працювати на базі [Bun][19]. Щоправда, на даний момент (v1.1.29), [Bun має баг][20], через який він некоректно працює з TypeScript. Якщо ви скачаєте стартер Ditsmod, встановите залежності, і спробуєте запустити затосунок:

```sh
git clone --depth 1 https://github.com/ditsmod/starter.git my-app
cd my-app
bun install
bun run build
bun dist/main.js
```

Bun кине наступну помилку:

```text
1 | (function (entry, fetcher)
    ^
SyntaxError: export 'ValueProvider' not found in './types-and-models.js'
```

На даний момент, цей баг можна обійти, якщо видалити файли `tsconfig.json` з усіх пакетів Ditsmod:

```sh
rm node_modules/@ditsmod/*/tsconfig.json
```

Окрім цього, якщо ваш застосунок має конфігурацію `compilerOptions.paths` у `tsconfig.json`, Bun через це некоректно працює також. Просто закоментуйте або видаліть цю секцію з `tsconfig.json`. Після цього треба запускати скомпільовану версію вхідного файла:

```sh
bun dist/main.js
```


[1]: #встановлення
[2]: https://github.com/ditsmod/starter
[4]: https://github.com/ditsmod/ditsmod/tree/main/examples
[9]: https://github.com/angular/angular
[10]: https://jestjs.io/en/
[12]: https://uk.wikipedia.org/wiki/%D0%9E%D0%B4%D0%B8%D0%BD%D0%B0%D0%BA_(%D1%88%D0%B0%D0%B1%D0%BB%D0%BE%D0%BD_%D0%BF%D1%80%D0%BE%D1%94%D0%BA%D1%82%D1%83%D0%B2%D0%B0%D0%BD%D0%BD%D1%8F) "Singleton"
[13]: https://github.com/ditsmod/realworld
[14]: https://www.techempower.com/benchmarks/#section=test&runid=967babf5-cf1a-4b3f-a6d0-1cd49ef2c424&hw=ph&test=composite&l=zieepr-67z
[15]: https://github.com/remy/nodemon
[16]: https://www.typescriptlang.org/docs/handbook/project-references.html
[17]: https://github.com/TypeStrong/ts-node
[18]: https://nodejs.org/api/packages.html#imports
[19]: https://bun.sh/
[20]: https://github.com/oven-sh/bun/issues/10438
