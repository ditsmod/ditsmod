---
slug: /
sidebar_position: 0
---

# What is Ditsmod

## Introduction to Ditsmod {#introduction-to-ditsmod}

Ditsmod is a Node.js-based web framework designed for building highly extensible and fast applications. Its name combines **DI** + **TS** + **Mod** to highlight its key features: it includes **D**ependency **I**njection, is written in **T**ype**S**cript in ESM format, and is designed with strong **Mod**ularity in mind.

### Key Features of Ditsmod {#key-features-of-ditsmod}

- **Modular architecture** with decorators, enabling declarative application structure definition.
- Support for creating custom extensions (sometimes referred to as plugins) that can initialize asynchronously and depend on one another.
- Built-in **OpenAPI** support with request validation based on OpenAPI metadata.
- As of today, [Ditsmod is one of the fastest Node.js web frameworks][14]:

![JS frameworks benchmarks][22]

Some architectural concepts in Ditsmod are inspired by [Angular][9], with its DI system built on Angular's native DI module.

### ExpressJS vs. Ditsmod {#expressjs-vs-ditsmod}

For comparison, the following examples demonstrate the minimal code needed to start applications with ExpressJS and Ditsmod.

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

But why isn’t Ditsmod as minimalistic as ExpressJS? As you can see in the example, ExpressJS creates an application object, to which routes are then added. The `app` object represents the API of various separate components, including router configuration, error handling setup, rendering system configuration, HTTP server setup, etc. Such code looks very compact in simple examples, but in essence, it violates the [Single Responsibility Principle][21]. In contrast, Ditsmod clearly distinguishes between:

- the role of the controller in which the route is created;
- the role of the module where the controllers are declared;
- the role of the application that contains the HTTP server.

Looking at the amount of code, you might think that Ditsmod is slower than ExpressJS because of its verbosity. But in fact, only Ditsmod's cold start is slightly slower (it starts in 34 ms on my laptop, while ExpressJS starts in 4 ms). As for request processing speed, [Ditsmod is ~30% faster than ExpressJS][14].

More application examples are available in the [Ditsmod][4] repository, as well as in the [RealWorld][13] repository.

P.S. Although a link to a repository with all the necessary settings for Ditsmod applications is provided below, still, if you want to use only the code from the previous example, do not forget to specify the following in the tsconfig files:

```json {4-5}
{
  "compilerOptions": {
    // ...
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Prerequisites {#prerequisites}

Please make sure that Node.js >= v20.6.0 is installed on your operating system.

## Installation {#installation}

You can install the `@ditsmod/cli` package globally to create a new application:

```bash
npm i -g @ditsmod/cli
dm new my-app
cd my-app
```

Or without prior installation using `npx`:

```bash
npx @ditsmod/cli new my-app
cd my-app
```

This way you can create a REST-application (by default) or a monorepo:

```bash
dm new my-app
```

Key options of the `new` command:

- `-t, --template <name>` — starter template (`rest`, `rest-monorepo`, `trpc-monorepo`).
- `-m, --package-manager <name>` — package manager to use (`npm`, `yarn`, `pnpm`).
- `--skip-install` — skip automatic dependency installation.

### Add `AGENTS.md` and `SKILL.md` for AI agents {#add-agent-skills}

The file [AGENTS.md][3] is intended for AI agents and should be placed in the root directory of the repository. This file will be taken into account by the AI agent every time you interact with the agent. To copy the latest version of `AGENTS.md`, run the following command:

```bash
cd my-app # Go to starter repository
npm run setup:agents
```

Additionally, you can install [AI agent skills][5] to help them better understand the specifics of Ditsmod applications:

```bash
npx skills add ditsmod/agent-skills
```

This command will let you choose from all available skills. If you want to install all the official skills for Ditsmod, you can do it like this:

```bash
npx skills add ditsmod/agent-skills --skill '*' -y
```

AI agent skills are only loaded when needed, when you ask something relevant to them.

## Start in Development Mode {#start-in-development-mode}

You can start the application in development mode with the following command:

```bash
npm run start:dev
```

Or directly using Ditsmod CLI:

```bash
ditsmod start
# or using the shorthand alias:
dm start
```

The `@ditsmod/cli` utility automatically handles incremental TypeScript compilation and restarts the Node.js server whenever source files are changed, eliminating the need to run separate compiler and server terminals.

You can customize the startup behavior using options:

- `-d, --debug [hostport]` — runs Node.js in debug mode with the `--inspect` flag.
- `--verbose` — shows verbose progress of TypeScript Project References compilation.
- `--restart-delay <ms>` — delay in milliseconds before restarting the server after successful compilation (default is `300`).
- `--watch-assets <globs...>` — non-TypeScript asset globs to watch and copy to `dist/` on changes.

You can check the server operation using `curl`:

```bash
curl -i localhost:3000/api/hello
```

Or simply by going to [http://localhost:3000/api/hello](http://localhost:3000/api/hello) in your browser.

By default, the application works with `info` log level. You can change it in the file `src/app/app.module.ts` (or `apps/backend/src/app/app.module.ts` in the monorepository).

Thanks to [ditsmod/rest-starter][2]'s use of the so-called [Project References][16] and `tsc -b` build mode, even very large projects compile very quickly.

Note that there are four config files for TypeScript in the `ditsmod/rest-starter` repository:

- `tsconfig.json` - the basic configuration used by your IDE (in most cases it is probably VS Code).
- `tsconfig.build.json` - this configuration is used to compile the code from the `src` directory to the `dist` directory, it is intended for application code.
- `tsconfig.e2e.json` - this configuration is used to compile end-to-end tests.
- `tsconfig.unit.json` - this configuration is used to compile unit tests.

Also, note that since `ditsmod/rest-starter` is declared as an EcmaScript Module (ESM), you can use [native Node.js aliases][18] to shorten file paths. This is analogous to `compilerOptions.paths` in `tsconfig`. Such aliases are declared in `package.json` in the `imports` field:

```json {2}
"imports": {
  "#app/*": "./dist/app/*"
},
```

Now you can use it, for example in the `e2e` folder, like this:

```ts
import { AppModule } from '#app/app.module.js';
```

At the moment (2025-10-07) TypeScript does not yet fully support these aliases, so it is advisable to duplicate them in the `tsconfig.json` file:

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

Note that in `package.json` the aliases point to `dist`, while in `tsconfig.json` they point to `src`.

## Start in product mode {#start-in-product-mode}

The application is compiled and the server is started in product mode using the command:

```bash
npm run build
npm run start-prod
```

## Entry file for Node.js {#entry-file-for-nodejs}

After [installing Ditsmod starter][1], the first thing you need to know: all the application code is in the `src` folder, it is compiled using the TypeScript utility `tsc`, after compilation it goes to the `dist` folder, and then as JavaScript code it can be executed in Node.js.

Let's look at the `src/main.ts` file:

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

After compilation, it becomes `dist/main.js` and becomes the entry point for running the application in production mode, and so why you will specify it as an argument to Node.js:

```bash
node dist/main.js
```

Looking at the file `src/main.ts`, you can see that an instance of the class `RestApplication` is created, and as an argument for the method `create()` is passed `AppModule`. Here `AppModule` is the root module to which other application modules then imports.

[1]: #installation
[2]: https://github.com/ditsmod/rest-starter
[3]: https://github.com/vercel-labs/agent-skills/blob/main/AGENTS.md
[4]: https://github.com/ditsmod/ditsmod/tree/main/examples
[5]: https://agentskills.io/home
[9]: https://github.com/angular/angular
[10]: https://jestjs.io/en/
[12]: https://en.wikipedia.org/wiki/Singleton_pattern
[13]: https://github.com/ditsmod/realworld
[14]: https://github.com/ditsmod/vs-webframework
[15]: https://github.com/remy/nodemon
[16]: https://www.typescriptlang.org/docs/handbook/project-references.html
[17]: https://github.com/TypeStrong/ts-node
[18]: https://nodejs.org/api/packages.html#imports
[21]: https://en.wikipedia.org/wiki/Single-responsibility_principle
[22]: https://raw.githubusercontent.com/ditsmod/vs-webframework/refs/heads/main/req-per-sec-frameworks4.png
