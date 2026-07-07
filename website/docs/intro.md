---
slug: /
sidebar_position: 0
---

# Що таке Ditsmod

## Ознайомлення з Ditsmod {#introduction-to-ditsmod}

Ditsmod - це веб-фреймворк на базі Node.js, призначений для створення добре-розширюваних та швидких застосунків, його назва складається з **DI** + **TS** + **Mod**, щоб підкреслити важливі складові: він має **D**ependency **I**njection, написаний на **T**ype**S**cript у форматі ESM, та спроектований для хорошої **Мод**ульності.

### Головні особливості Ditsmod {#key-features-of-ditsmod}

- **Модульна архітектура** на декораторах, що дозволяє декларативно описувати структуру застосунку.
- Можливість написання власних розширень (інколи їх називають плагінами), що можуть асинхронно ініціалізуватись, і що можуть залежати один від одного.
- Має підтримку **OpenAPI**, та має можливість проводити валідацію запитів на основі метаданих OpenAPI.
- На сьогодішній день, [Ditsmod є одним із найшвидших серед Node.js веб фреймворків][14]:

![JS frameworks benchmarks][22]

Деякі концепції архітектури Ditsmod взяті з [Angular][9] концепцій, а DI побудована на базі нативного модуля Angular DI.

## Попередні умови {#prerequisites}

Будь-ласка, переконайтесь що на вашій операційній системі встановлено Node.js >= v24.0.0.

## Встановлення {#installation}

Ви можете встановити пакет `@ditsmod/cli` глобально, щоб створити новий застосунок:

```bash
npm i -g @ditsmod/cli
dm new my-app
cd my-app
```

Або без попереднього встановлення через `npx`:

```bash
npx @ditsmod/cli new my-app
cd my-app
```

Також ви можете створити дефолтний REST-застосунок або монорепозиторій:

```bash
dm new my-app
```

Основні опції команди `new`:

- `-t, --template <name>` — стартовий шаблон (`rest`, `rest-monorepo`, `trpc-monorepo`).
- `-m, --package-manager <name>` — менеджер пакетів (`npm`, `yarn`, `pnpm`).
- `--skip-install` — пропустити автоматичне встановлення залежностей.

### Додайте `AGENTS.md` та `SKILL.md` для ШІ-агентів {#add-agent-skills}

Файл [AGENTS.md][3] призначений для ШІ-агентів, його треба встановлювати в кореневу директорію репозиторію. Цей файл буде братись до уваги ШІ-агентом кожен раз, коли ви звертаєтесь до агента. Щоб скопіювати самий свіжий `AGENTS.md`, запустіть наступну команду:

```bash
cd my-app # Перехід до стартового репозиторію
npm run setup:agents
```

Додатково можна встановити ще й [скіли для ШІ-агентів][5], щоб вони краще розуміли особливості Ditsmod-застосунків:

```bash
npx skills add ditsmod/agent-skills
```

Ця команда дасть на вибір усі доступні скіли. Якщо ж ви хочете встановити усі офіційни скіли для Ditsmod, це можна зробити так:

```bash
npx skills add ditsmod/agent-skills --skill '*' -y
```

Скіли ШІ-агентами зчитуються лише у разі потреби, коли ви запитуєте щось релевантне у них.

## Запуск в режимі розробки {#start-in-development-mode}

Стартувати застосунок в режимі розробки можна за допомогою команди:

```bash
npm run start:dev
```

Або безпосередньо через Ditsmod CLI:

```bash
ditsmod start
# або за допомогою аліасу:
dm start
```

Утиліта `@ditsmod/cli` автоматично виконує інкрементальну компіляцію TypeScript та перезапускає Node.js сервер при зміні файлів, тому більше не потрібно відкривати декілька терміналів окремо для компілятора та сервера.

Ви можете налаштувати поведінку запуску за допомогою опцій:

- `-d, --debug [hostport]` — запуск Node.js у режимі налагодження з прапорцем `--inspect`.
- `--verbose` — детальний вивід процесу збірки TypeScript Project References.
- `--restart-delay <ms>` — затримка в мілісекундах перед перезапуском сервера після успішної компіляції (за замовчуванням `300`).
- `--watch-assets <globs...>` — не-TypeScript файли (наприклад, `.json`), які потрібно копіювати в `dist/` при змінах.

Перевірити роботу сервера можна за допомогою `curl`:

```bash
curl -i localhost:3000/api/hello
```

Або просто перейшовши у браузері на [http://localhost:3000/api/hello](http://localhost:3000/api/hello).

По дефолту, застосунок працює з деталізацією log level на рівні `info`. Змінити його можна у файлі `src/app/app.module.ts` (або `apps/backend/src/app/app.module.ts` у монорепозиторію).

Завдяки використанню у [ditsmod/rest-starter][2] так званих [Project References][16] і режиму збірки `tsc -b`, навіть дуже великі проекти компілюються дуже швидко.

Зверніть увагу, що у репозиторії `ditsmod/rest-starter` є чотири конфіг-файли для TypeScript:

- `tsconfig.json` - базова конфігурація, що використовується вашою IDE (у більшості це мабуть VS Code).
- `tsconfig.build.json` - ця конфігурація використовується для компіляції коду з теки `src` у теку `dist`, вона призначається для коду застосунку.
- `tsconfig.e2e.json` - ця конфігурація використовується для компіляції коду end-to-end тестів.
- `tsconfig.unit.json` - ця конфігурація використовується для компіляції коду юніт-тестів.

Окрім цього, зверніть увагу, що завдяки тому, що `ditsmod/rest-starter` оголошено як EcmaScript Module (ESM), для скорочення шляху до файлів ви можете використовувати [нативні аліаси Node.js][18]. Це аналог `compilerOptions.paths` у `tsconfig`. Такі аліаси оголошуються у `package.json` у полі `imports`:

```json {2}
"imports": {
  "#app/*": "./dist/app/*"
},
```

Тепер ви можете використовувати його, наприклад у теці `e2e`, ось так:

```ts
import { AppModule } from '#app/app.module.js';
```

На даний момент (2025-10-07) TypeScript ще не у повній мірі підтримує ці аліаси, тому бажано їх продублювати у файлі `tsconfig.json`:

```json {6}
// ...
{
  "compilerOptions": {
    // ...
    "paths": {
      "#app/*": ["./src/app/*"]
    }
  }
}
```

Зверніть увагу, що у `package.json` аліаси вказують на `dist`, тоді як у `tsconfig.json` - на `src`.

## Запуск в продуктовому режимі {#start-in-product-mode}

Компіляція застосунку та запуск сервера в продуктовому режимі відбувається за допомогою команди:

```bash
npm run build
npm run start-prod
```

## Вхідний файл для Node.js {#entry-file-for-nodejs}

Після [встановлення Ditsmod starter][1], перше, що необхідно знати: весь код застосунку знаходиться у теці `src`, він компілюється за допомогою TypeScript-утиліти `tsc`, після компіляції попадає у теку `dist`, і далі вже у вигляді JavaScript-коду його можна виконувати у Node.js.

Давайте розглянемо файл `src/main.ts`:

```ts
import { ServerOptions } from 'node:http';
import { RestApplication } from '@ditsmod/rest';

import { AppModule } from './app/app.module.js';
import { checkCliAndSetPort } from './app/utils/check-cli-and-set-port.js';

const serverOptions: ServerOptions = { keepAlive: true, keepAliveTimeout: 5000 };
const app = await RestApplication.create(AppModule, { serverOptions, path: 'api' });
const port = checkCliAndSetPort(3000);
app.server.listen(port, '0.0.0.0');
```

Після компіляції, він перетворюється на `dist/main.js` та стає вхідною точкою для запуску застосунку у продуктовому режимі, і саме тому ви будете його вказувати у якості аргументу для Node.js:

```bash
node dist/main.js
```

Проглядаючи файл `src/main.ts`, ви можете бачити, що створюється інстанс класу `RestApplication`, а у якості аргументу для методу `create()` передається `AppModule`. Тут `AppModule` є кореневим модулем, до якого вже підв'язуються інші модулі застосунку.

## ExpressJS vs. Ditsmod {#expressjs-vs-ditsmod}

Для порівняння, в наступних двох прикладах показано мінімальний код для запуску ExpressJS та Ditsmod застосунків.

```js
import express from 'express';
const app = express();

app.get('/hello', function (req, res) {
  ctx.send('Hello, World!');
});

app.listen(3000, '0.0.0.0');
```

```ts
import { controller, route, restRootModule, RestApplication } from '@ditsmod/rest';

@controller()
class ExampleController {
  @route('GET', 'hello')
  tellHello() {
    return 'Hello, World!';
  }
}

@restRootModule({ controllers: [ExampleController] })
class AppModule {}

const app = await RestApplication.create(AppModule);
app.server.listen(3000, '0.0.0.0');
```

Але чому Ditsmod не такий мінімалістичний, як ExpressJS? Як бачите в прикладі, ExpressJS створює об'єкт застосунку, в якому потім додає роути. В об'єкті `app` представлено API різних окремих складових, зокрема: налаштування роутера, налаштування обробки помилок, налаштування системи рендерінгу, HTTP-сервера і т.д. Такий код у простих прикладах виглядає дуже компактно, але у ньому по-суті порушується [Принцип єдиної відповідальності][21]. Натомість в Ditsmod чітко розмежовано:

- роль контролера, в якому створюється роут;
- роль модуля, в якому задекларовано контролери;
- роль застосунку, який містить HTTP-сервер.

Оцінюючи об'єм коду, можна припустити, що через свою багатослівність, Ditsmod є повільнішим за ExpressJS. Але насправді трохи повільнішим є лише холодний старт Ditsmod (на моєму ноутбуку він стартує за 34 ms, тоді як ExpressJS стартує за 4 ms). Що стосується швидкості обробки запитів, то [Ditsmod швидший за ExpressJS на ~30%][14].

Більше прикладів застосунку є у репозиторію [Ditsmod][4], а також у репозиторію [RealWorld][13].

P.S. Хоча нижче надано лінк на репозиторій з усіма необхідними налаштуваннями для Ditsmod-застосунків, але, все ж таки, якщо ви захочете використати лише код з попереднього прикладу, незабудьте у tsconfig-файлах прописати наступне:

```json {4-5}
{
  "compilerOptions": {
    // ...
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

[1]: #installation
[2]: https://github.com/ditsmod/rest-starter
[3]: https://github.com/vercel-labs/agent-skills/blob/main/AGENTS.md
[4]: https://github.com/ditsmod/ditsmod/tree/main/examples
[5]: https://agentskills.io/home
[9]: https://github.com/angular/angular
[10]: https://jestjs.io/en/
[12]: https://uk.wikipedia.org/wiki/%D0%9E%D0%B4%D0%B8%D0%BD%D0%B0%D0%BA_(%D1%88%D0%B0%D0%B1%D0%BB%D0%BE%D0%BD_%D0%BF%D1%80%D0%BE%D1%94%D0%BA%D1%82%D1%83%D0%B2%D0%B0%D0%BD%D0%BD%D1%8F) 'Singleton'
[13]: https://github.com/ditsmod/realworld
[14]: https://github.com/ditsmod/vs-webframework
[15]: https://github.com/remy/nodemon
[16]: https://www.typescriptlang.org/docs/handbook/project-references.html
[17]: https://github.com/TypeStrong/ts-node
[18]: https://nodejs.org/api/packages.html#imports
[21]: https://uk.wikipedia.org/wiki/%D0%9F%D1%80%D0%B8%D0%BD%D1%86%D0%B8%D0%BF_%D1%94%D0%B4%D0%B8%D0%BD%D0%BE%D1%97_%D0%B2%D1%96%D0%B4%D0%BF%D0%BE%D0%B2%D1%96%D0%B4%D0%B0%D0%BB%D1%8C%D0%BD%D0%BE%D1%81%D1%82%D1%96
[22]: https://raw.githubusercontent.com/ditsmod/vs-webframework/refs/heads/main/req-per-sec-frameworks4.png
