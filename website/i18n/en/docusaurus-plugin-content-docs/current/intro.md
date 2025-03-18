---
slug: /
sidebar_position: 1
---

# What is Ditsmod

## Introduction to Ditsmod

Ditsmod is a Node.js-based web framework designed for building highly extensible and fast applications. Its name combines **DI** + **TS** + **Mod** to highlight its key features: it includes **D**ependency **I**njection, is written in **T**ype**S**cript in ESM format, and is designed with strong **Mod**ularity in mind.

### Key Features of Ditsmod

- **Modular architecture** with decorators, enabling declarative application structure definition.
- Support for creating custom extensions (sometimes referred to as plugins) that can initialize asynchronously and depend on one another.
- Dynamic module addition and removal after the server starts, without requiring a restart.
- Built-in **OpenAPI** support with request validation based on OpenAPI metadata.
- As of today, [Ditsmod is one of the fastest Node.js web frameworks][14]:

![Techempower benchmarks](/img/tech-empower-benchmarks.png)

Some architectural concepts in Ditsmod are inspired by [Angular][9], with its DI system built on Angular's native DI module.

### ExpressJS vs. Ditsmod

For comparison, the following examples demonstrate the minimal code needed to start applications with ExpressJS and Ditsmod.

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
import { route, routingMetadata, RoutingModule } from '@ditsmod/routing';

@controller()
class ExampleController {
  @route('GET', 'hello')
  tellHello() {
    return 'Hello, World!';
  }
}

@routingMetadata({ controllers: [ExampleController] })
@rootModule({ imports: [RoutingModule] })
class AppModule {}

const app = await Application.create(AppModule);
app.server.listen(3000, '0.0.0.0');
```

Looking at the amount of code, you might think that Ditsmod is slower than ExpressJS because of its verbosity. But in fact, only Ditsmod's cold start is slightly slower (it starts in 34 ms on my laptop, while ExpressJS starts in 4 ms). In terms of request processing speed, [Ditsmod is more than twice as fast as ExpressJS][14].

More application examples are available in the [Ditsmod][4] repository, as well as in the [RealWorld][13] repository.

P.S. Although a link to the repository with all the necessary settings for Ditsmod applications is provided below, if you choose to use just this code, don't forget to include the following in your tsconfig files:

```json {4-5}
{
  "compilerOptions": {
    // ...
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Prerequisites

Please make sure that Node.js >= v20.6.0 is installed on your operating system.

## Installation

The basic set for running the application has a repository [ditsmod/starter][2]. Clone it and install the dependencies:

```bash
git clone --depth 1 https://github.com/ditsmod/starter.git my-app
cd my-app
npm i
```

Alternatively, you can use the starter monorepo:

```bash
git clone --depth 1 https://github.com/ditsmod/monorepo.git my-app
cd my-app
npm i
```

## Start in Development Mode

You can start the application in development mode with the following command:

```bash
npm run start:dev
```

You can check the server operation using `curl`:

```bash
curl -i localhost:3000/api/hello
```

Or simply by going to [http://localhost:3000/api/hello](http://localhost:3000/api/hello) in your browser.

By default, the application works with `info` log level. You can change it in the file `src/app/app.module.ts` or `apps/backend/src/app/app.module.ts` (in the monorepository).

Thanks to [ditsmod/starter][2]'s use of the so-called [Project References][16] and `tsc -b` build mode, even very large projects compile very quickly.

Note that there are four config files for TypeScript in the `ditsmod/starter` repository:

- `tsconfig.json` - the basic configuration used by your IDE (in most cases it is probably VS Code).
- `tsconfig.build.json` - this configuration is used to compile the code from the `src` directory to the `dist` directory, it is intended for application code.
- `tsconfig.e2e.json` - this configuration is used to compile end-to-end tests.
- `tsconfig.unit.json` - this configuration is used to compile unit tests.

Also, note that since `ditsmod/starter` is declared as an EcmaScript Module (ESM), you can use [native Node.js aliases][18] to shorten file paths. This is analogous to `compilerOptions.paths` in `tsconfig`. Such aliases are declared in `package.json` in the `imports` field:

```json {2}
"imports": {
  "#app/*": "./dist/app/*"
},
```

Now you can use it, for example in the `e2e` folder, like this:

```ts
import { AppModule } from '#app/app.module.js';
```

At the moment (2023-10-13) TypeScript does not yet fully support these aliases, so it is advisable to duplicate them in the `tsconfig.json` file:

```json
// ...
  "paths": {
    "#app/*": ["./src/app/*"]
  }
// ...
```

Note that in `package.json` the aliases point to `dist`, while in `tsconfig.json` they point to `src`.

## Start in product mode

The application is compiled and the server is started in product mode using the command:

```bash
npm run build
npm run start-prod
```

## Entry file for Node.js

After [installing Ditsmod starter][1], the first thing you need to know: all the application code is in the `src` folder, it is compiled using the TypeScript utility `tsc`, after compilation it goes to the `dist` folder, and then as JavaScript code it can be executed in Node.js.

Let's look at the `src/main.ts` file:

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

After compilation, it becomes `dist/main.js` and becomes the entry point for running the application in production mode, and so why you will specify it as an argument to Node.js:

```bash
node dist/main.js
```

Looking at the file `src/main.ts`, you can see that an instance of the class `Application` is created, and as an argument for the method `bootstrap()` is passed `AppModule`. Here `AppModule` is the root module to which other application modules then imports.

## Ditsmod on Bun

Ditsmod can run on [Bun][19]. However, as of version (v1.1.29), [Bun has a bug][20] that causes it to work incorrectly with TypeScript. If you download Ditsmod's starter, install the dependencies, and try to run the application:

```sh
git clone --depth 1 https://github.com/ditsmod/starter.git my-app
cd my-app
bun install
bun run build
bun dist/main.js
```

Bun will throw the following error:

```text
1 | (function (entry, fetcher)
    ^
SyntaxError: export 'ValueProvider' not found in './types-and-models.js'
```

At the moment, this bug can be worked around by removing the `tsconfig.json` files from all Ditsmod packages:

```sh
rm node_modules/@ditsmod/*/tsconfig.json
```

Additionally, if your application has `compilerOptions.paths` configured in `tsconfig.json`, Bun will also malfunction. Simply comment out or remove this section from `tsconfig.json`. Afterward, you need to run the compiled version of the entry file:

```sh
bun dist/main.js
```


[1]: #installation
[2]: https://github.com/ditsmod/starter
[4]: https://github.com/ditsmod/ditsmod/tree/main/examples
[8]: https://en.wikipedia.org/wiki/Dependency_injection
[9]: https://github.com/angular/angular
[10]: https://jestjs.io/en/
[12]: https://en.wikipedia.org/wiki/Singleton_pattern
[13]: https://github.com/ditsmod/realworld
[14]: https://www.techempower.com/benchmarks/#section=test&runid=967babf5-cf1a-4b3f-a6d0-1cd49ef2c424&hw=ph&test=composite&l=zieepr-33z
[15]: https://github.com/remy/nodemon
[16]: https://www.typescriptlang.org/docs/handbook/project-references.html
[17]: https://github.com/TypeStrong/ts-node
[18]: https://nodejs.org/api/packages.html#imports
[19]: https://bun.sh/
[20]: https://github.com/oven-sh/bun/issues/10438
